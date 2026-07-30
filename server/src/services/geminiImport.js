import ApiError from '../utils/ApiError.js'
import { RESUME_SCHEMA, normalizeAiResume } from './geminiImprove.js'
import { callGeminiJSON } from './geminiClient.js'

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

// Shares the same big RESUME_SCHEMA as geminiImprove.js and just as capable
// of needing real headroom on a long resume — see geminiClient.js for the
// shared retry/thinking-budget-probe logic this now goes through.
const MAX_OUTPUT_TOKENS = 16384

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
    raw = await callGeminiJSON({ prompt, schema: RESUME_SCHEMA, maxOutputTokens: MAX_OUTPUT_TOKENS })
  } catch (err) {
    console.error('Gemini import call failed:', err)
    if (String(err?.message || '').includes('cut off')) {
      throw ApiError.internal('The AI response was too long to complete — try again with a shorter resume file')
    }
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
