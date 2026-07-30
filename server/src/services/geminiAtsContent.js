import ApiError from '../utils/ApiError.js'
import { callGeminiJSON } from './geminiClient.js'

// The AI-judged half of the independent ATS score — deliberately scoped to
// content/writing quality ONLY. Structural/formatting issues (missing
// sections, no extractable text, contact info, etc.) are already covered
// deterministically by atsRules.js; asking Gemini to also judge those would
// be less reliable (it can't truly see layout/columns from extracted text)
// and would double-count the same signal. This schema is small, same
// reasoning as geminiAnalysis.js for why it's less exposed to the
// thinking-budget truncation issue that geminiImprove.js/geminiImport.js
// had to guard against.
const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    contentScore: {
      type: 'integer',
      description: 'Writing/content quality from 0 to 100 — action verbs, quantified impact, clarity, specificity, professional tone. NOT formatting or structure.',
    },
    strengths: { type: 'array', items: { type: 'string' }, description: 'What the writing does well, specifically.' },
    weaknesses: { type: 'array', items: { type: 'string' }, description: 'Specific writing/content weaknesses, not formatting issues.' },
    suggestions: { type: 'array', items: { type: 'string' }, description: 'Concrete, actionable rewrites or improvements.' },
  },
  required: ['contentScore', 'strengths', 'weaknesses', 'suggestions'],
}

function buildPrompt(resumeText) {
  return `You are a resume-writing expert scoring a resume's WRITING QUALITY for general ATS/recruiter readiness — this is NOT tied to any specific job description, so don't invent one or assume a target role.

Judge ONLY the writing and content, not formatting, layout, or section structure (that is scored separately by a different system):
- Use of strong, specific action verbs vs. weak or passive phrasing ("responsible for", "helped with")
- Quantified impact — real numbers, percentages, scale — vs. vague duty-listing with no measurable outcome
- Clarity and conciseness vs. filler, redundancy, or generic buzzwords ("hardworking", "team player", "results-driven") used without real evidence
- Specificity and credibility of claims vs. generic, could-apply-to-anyone statements
- Overall professional tone

Score strictly — a resume that is competently written but generic/unquantified should NOT score in the 90s. Reserve high scores for resumes with genuinely specific, quantified, well-phrased accomplishments throughout.

RESUME:
"""
${resumeText}
"""

Return JSON matching the provided schema. strengths/weaknesses should be specific to THIS resume's actual wording, not generic advice. suggestions should be concrete enough to act on directly, e.g. "Rewrite 'responsible for managing a team' as 'Led a team of 6 engineers, cutting release cycle time by 30%'" rather than "add more detail."`
}

const MAX_OUTPUT_TOKENS = 4096

export async function scoreResumeContent(resumeText) {
  if (!resumeText?.trim()) {
    throw ApiError.badRequest('No resume text to score')
  }

  const prompt = buildPrompt(resumeText)

  let raw
  try {
    raw = await callGeminiJSON({ prompt, schema: RESPONSE_SCHEMA, maxOutputTokens: MAX_OUTPUT_TOKENS })
  } catch (err) {
    console.error('Gemini ATS content-score call failed:', err)
    if (String(err?.message || '').includes('cut off')) {
      throw ApiError.internal('The AI response was too long to complete — try again with a shorter resume')
    }
    throw ApiError.internal('AI content scoring is temporarily unavailable — please try again in a moment')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('Gemini returned non-JSON output for ATS content score:', raw)
    throw ApiError.internal('AI content scoring returned an unexpected response — please try again')
  }

  const asStringArray = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [])

  return {
    contentScore: Math.max(0, Math.min(100, Math.round(Number(parsed.contentScore) || 0))),
    strengths: asStringArray(parsed.strengths),
    weaknesses: asStringArray(parsed.weaknesses),
    suggestions: asStringArray(parsed.suggestions),
  }
}
