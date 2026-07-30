import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js'
import ApiError from '../utils/ApiError.js'

// Gemini's structured-output mode (responseMimeType + responseSchema) makes it
// return JSON matching this shape directly, instead of us having to coax JSON
// out of free-form text with regex/markdown-fence stripping.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    score: {
      type: 'integer',
      description: 'Overall match score from 0 to 100 between the resume and the job description.',
    },
    matchedKeywords: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific skills, technologies, or qualifications from the job description that are present in the resume.',
    },
    missingKeywords: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific skills, technologies, or qualifications from the job description that are missing from the resume.',
    },
    suggestions: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific, actionable suggestions to improve the resume for this job description.',
    },
  },
  required: ['score', 'matchedKeywords', 'missingKeywords', 'suggestions'],
}

function buildPrompt(resumeText, jdText) {
  return `You are an ATS (Applicant Tracking System) resume analyzer. Compare the RESUME to the JOB DESCRIPTION below and evaluate how well it matches.

Score strictly based on relevant skills/keyword overlap, relevant experience, and role fit. A generic or unrelated resume should score low even if it is well written.

RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""

Return your evaluation as JSON matching the provided schema.
- matchedKeywords / missingKeywords: specific skills, tools, technologies, or qualifications mentioned in the job description — not generic filler words.
- suggestions: concrete and actionable, e.g. "Quantify your impact on the payments project with a metric" rather than vague advice like "improve your resume."`
}

const MAX_ATTEMPTS = 3
const RETRYABLE_STATUS = new Set([429, 500, 503])

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryable(err) {
  const status = err?.status ?? err?.response?.status ?? err?.cause?.status
  if (RETRYABLE_STATUS.has(status)) return true
  const message = String(err?.message || '').toLowerCase()
  return message.includes('overloaded') || message.includes('rate limit') || message.includes('unavailable')
}

// Retries only transient failures (rate limits, momentary server hiccups) with
// exponential backoff — a bad prompt or missing key fails immediately instead
// of retrying something that will never succeed.
async function callGeminiWithRetry(prompt) {
  const ai = getGeminiClient()
  let lastErr

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      })
      return response.text
    } catch (err) {
      lastErr = err
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break
      await sleep(500 * 2 ** (attempt - 1)) // 500ms, 1s
    }
  }

  throw lastErr
}

export async function analyzeResumeAgainstJD(resumeText, jdText) {
  if (!resumeText?.trim()) {
    throw ApiError.badRequest('No resume text to analyze')
  }
  if (!jdText?.trim()) {
    throw ApiError.badRequest('No job description text to analyze')
  }

  const prompt = buildPrompt(resumeText, jdText)

  let raw
  try {
    raw = await callGeminiWithRetry(prompt)
  } catch (err) {
    console.error('Gemini analysis call failed:', err)
    throw ApiError.internal('AI analysis is temporarily unavailable — please try again in a moment')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('Gemini returned non-JSON output:', raw)
    throw ApiError.internal('AI analysis returned an unexpected response — please try again')
  }

  // Defensive normalization — never fully trust the model to follow the
  // schema, even with responseSchema set.
  const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0)))
  const asStringArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])

  return {
    score,
    matchedKeywords: asStringArray(parsed.matchedKeywords),
    missingKeywords: asStringArray(parsed.missingKeywords),
    suggestions: asStringArray(parsed.suggestions),
  }
}
