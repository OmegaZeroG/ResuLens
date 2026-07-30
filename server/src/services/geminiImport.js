import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js'
import ApiError from '../utils/ApiError.js'
import { RESUME_SCHEMA, normalizeAiResume } from './geminiImprove.js'

// Unlike improveResumeForJD (which deliberately rewrites content to target a
// job description), this is a faithful transcription: take an uploaded
// resume's raw text and map it into our structured schema so it can be
// loaded into the builder and edited live, without rephrasing or inventing
// anything. Reuses the exact same RESUME_SCHEMA and normalization/contact-
// backfill logic as improve, since both need the same defensive handling of
// whatever shape Gemini actually returns.
function buildPrompt(resumeText) {
  return `You are extracting structured data from an existing resume so it can be loaded into a resume builder for editing. This is a faithful transcription, not a rewrite.

STRICT RULES — do not break these:
- Do NOT rephrase, summarize, embellish, or invent anything. Copy wording as close to the original as possible.
- Do NOT omit any job, project, school, certification, or other entry present in the original — map every single one into the schema, with no exceptions.
- If a field genuinely isn't present in the original text, leave it as an empty string or empty array — never guess or fabricate a value.
- Preserve dates, numbers, and links exactly as written in the original.
- Capture every profile link found (LinkedIn, GitHub, LeetCode, Codeforces, personal site, anything) in contact.links, each with a short label naming the platform (e.g. "LinkedIn", "GitHub", "Codeforces") and its URL.
- Anything that doesn't fit the standard sections (Certifications, Awards, Publications, Volunteer Experience, Languages, etc.) belongs in customSections, each with its own title taken from (or closely matching) the original heading.

RESUME TEXT:
"""
${resumeText}
"""

Return the resume as JSON matching the provided schema — the complete resume, every section, mapped as faithfully as possible.`
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
          responseSchema: RESUME_SCHEMA,
        },
      })
      return response.text
    } catch (err) {
      lastErr = err
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS) break
      await sleep(500 * 2 ** (attempt - 1))
    }
  }

  throw lastErr
}

// Returns { title, sections } shaped exactly like our Resume model, ready to
// pass straight into Resume.create(). The caller is responsible for actually
// creating the new resume — this only does the AI extraction.
export async function importResumeFromText(resumeText) {
  if (!resumeText?.trim()) {
    throw ApiError.badRequest('No resume text to import — the file may be empty or unreadable')
  }

  const prompt = buildPrompt(resumeText)

  let raw
  try {
    raw = await callGeminiWithRetry(prompt)
  } catch (err) {
    console.error('Gemini import call failed:', err)
    throw ApiError.internal('AI resume import is temporarily unavailable — please try again in a moment')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('Gemini returned non-JSON output for import:', raw)
    throw ApiError.internal('AI import returned an unexpected response — please try again')
  }

  return normalizeAiResume(parsed, resumeText, { defaultTitle: 'Imported Resume' })
}
