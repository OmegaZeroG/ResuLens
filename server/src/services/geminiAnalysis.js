import ApiError from '../utils/ApiError.js'
import { callGeminiJSON } from './geminiClient.js'

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

// This schema is small, so it's less exposed to the thinking-budget
// truncation issue than the full-resume schemas in geminiImprove.js/
// geminiImport.js, but a long suggestions list on a verbose JD could still
// hit it — same shared helper, same protection either way.
const MAX_OUTPUT_TOKENS = 4096

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
    raw = await callGeminiJSON({ prompt, schema: RESPONSE_SCHEMA, maxOutputTokens: MAX_OUTPUT_TOKENS })
  } catch (err) {
    console.error('Gemini analysis call failed:', err)
    if (String(err?.message || '').includes('cut off')) {
      throw ApiError.internal(
        'The AI response was too long to complete — try again with a shorter resume or job description',
      )
    }
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
