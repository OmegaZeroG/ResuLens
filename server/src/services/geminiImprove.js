import { getGeminiClient, GEMINI_MODEL } from '../config/gemini.js'
import ApiError from '../utils/ApiError.js'
import { extractContactHints } from '../utils/resumeText.js'

// Mirrors the client's Resume schema (see client's useResume.js emptyResume /
// server's Resume.js) so the output can be saved directly as a new resume.
// Exported — geminiImport.js reuses this exact shape (and normalizeAiResume
// below) since "import from old resume" needs the same structured output,
// just with a different prompt (faithful extraction, not JD-tailored rewrite).
export const RESUME_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'A short resume title, e.g. "Frontend Developer Resume".' },
    contact: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        location: { type: 'string' },
        links: {
          type: 'array',
          description: 'Profile links — LinkedIn, GitHub, LeetCode, Codeforces, a personal site, anything found in the resume.',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string', description: 'What the link is, e.g. "LinkedIn", "GitHub", "Codeforces".' },
              url: { type: 'string' },
            },
          },
        },
      },
    },
    summary: { type: 'string' },
    skills: { type: 'array', items: { type: 'string' } },
    experience: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          company: { type: 'string' },
          role: { type: 'string' },
          location: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          current: { type: 'boolean' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    education: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          school: { type: 'string' },
          degree: { type: 'string' },
          fieldOfStudy: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          gpa: { type: 'string' },
        },
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          liveLink: { type: 'string' },
          githubLink: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    customSections: {
      type: 'array',
      description: 'Any freeform sections beyond the standard ones — Certifications, Awards, Publications, etc.',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
  required: ['title', 'contact', 'summary', 'skills', 'experience', 'education', 'projects', 'customSections'],
}

function buildPrompt(resumeText, jdText, missingKeywords) {
  const keywordHint = missingKeywords?.length
    ? `\n\nThe candidate's resume is currently missing these keywords/skills the job description asks for: ${missingKeywords.join(', ')}. Where the resume's existing experience genuinely supports it, surface and use this terminology explicitly. Do not add any of these as a skill or claim unless the original resume text already provides real evidence of it.`
    : ''

  return `You are an expert resume writer helping a candidate tailor their resume to a specific job description, for an ATS (Applicant Tracking System) optimization tool.

STRICT RULES — do not break these:
- Do NOT invent employers, job titles, dates, degrees, schools, or skills the candidate does not already have evidence of in their original resume.
- Do NOT invent specific numbers or metrics that aren't implied by the original text.
- You MAY: rephrase for clarity and impact, reorder content, use stronger action verbs, align terminology with the job description's language where the underlying experience genuinely supports it, tighten or expand bullet points, and write a new summary tailored to this role.
- You MUST include every single job, every single project, and every single school from the original resume in your output — every entry, with no exceptions. Do not omit an entry just because it seems less relevant to this specific job; relevance is not a reason to delete someone's real history. If in doubt, keep it in.
- You MUST carry over the candidate's full contact information exactly as it appears in the original resume — full name, email, phone, location, and every profile link (LinkedIn, GitHub, LeetCode, Codeforces, personal site, anything present). Copy these values verbatim; never drop a contact field or link that's present in the original.
- You MUST carry over each project's live demo link and GitHub repo link exactly as they appear in the original resume — never drop, alter, or invent a project link.
- You MUST include every custom/additional section from the original resume (e.g. Certifications, Awards, Publications, Volunteer Experience) in your output, with the same title and every entry — do not drop a section just because it seems less relevant to this specific job.

ORIGINAL RESUME:
"""
${resumeText}
"""

JOB DESCRIPTION:
"""
${jdText}
"""
${keywordHint}

Return the full improved resume as JSON matching the provided schema — the complete resume, not just the changed parts. Dates can stay as plain strings in whatever format the original used (e.g. "2022", "Jan 2022", "2022-01").`
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

function asStringArray(v) {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
}

// Shared by improveResumeForJD and geminiImport.js's importResumeFromText —
// both ask Gemini for the same RESUME_SCHEMA shape and need the same
// defensive normalization (never trust the AI's JSON shape blindly) plus the
// same regex-based contact backfill. Returns { title, sections } shaped
// exactly like our Resume model, ready to pass straight into Resume.create().
export function normalizeAiResume(parsed, resumeText, { defaultTitle = 'Untitled Resume' } = {}) {
  const contact = parsed.contact || {}
  // Deterministic, regex-based fallback: the AI's structured output has been
  // observed to silently drop contact fields (e.g. email, location) even
  // with explicit prompt instructions not to. Since email/phone/profile-links
  // are reliably pattern-matchable from the raw resume text, backfill
  // anything the AI missed rather than trusting it caught everything.
  const hints = extractContactHints(resumeText)

  const aiLinks = Array.isArray(contact.links)
    ? contact.links
        .filter((l) => l?.url)
        .map((l) => ({ label: (l.label || '').trim(), url: (l.url || '').trim() }))
    : []
  const aiUrls = new Set(aiLinks.map((l) => l.url.toLowerCase()))
  // Only backfill a hint if the AI didn't already return that same URL under
  // some label — avoids adding a duplicate "LinkedIn" entry next to the one
  // the model already found.
  const backfillLinks = (hints.links || []).filter((l) => !aiUrls.has(l.url.toLowerCase()))

  return {
    title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : defaultTitle,
    sections: {
      contact: {
        fullName: contact.fullName || '',
        email: contact.email || hints.email || '',
        phone: contact.phone || hints.phone || '',
        location: contact.location || '',
        links: [...aiLinks, ...backfillLinks],
      },
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      skills: asStringArray(parsed.skills),
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map((exp) => ({
            company: exp.company || '',
            role: exp.role || '',
            location: exp.location || '',
            startDate: exp.startDate || '',
            endDate: exp.endDate || '',
            current: Boolean(exp.current),
            bullets: asStringArray(exp.bullets),
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map((edu) => ({
            school: edu.school || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: edu.startDate || '',
            endDate: edu.endDate || '',
            gpa: edu.gpa || '',
          }))
        : [],
      projects: Array.isArray(parsed.projects)
        ? parsed.projects.map((proj) => ({
            name: proj.name || '',
            description: proj.description || '',
            liveLink: proj.liveLink || '',
            githubLink: proj.githubLink || '',
            bullets: asStringArray(proj.bullets),
          }))
        : [],
      customSections: Array.isArray(parsed.customSections)
        ? parsed.customSections.map((section) => ({
            title: section.title || '',
            bullets: asStringArray(section.bullets),
          }))
        : [],
    },
  }
}

// Returns { title, sections } shaped exactly like our Resume model, ready to
// pass straight into Resume.create(). Never overwrites the original — the
// caller is responsible for saving this as a new resume.
export async function improveResumeForJD(resumeText, jdText, missingKeywords = []) {
  if (!resumeText?.trim()) {
    throw ApiError.badRequest('No resume text to improve')
  }
  if (!jdText?.trim()) {
    throw ApiError.badRequest('No job description text to target')
  }

  const prompt = buildPrompt(resumeText, jdText, missingKeywords)

  let raw
  try {
    raw = await callGeminiWithRetry(prompt)
  } catch (err) {
    console.error('Gemini improve call failed:', err)
    throw ApiError.internal('AI resume improvement is temporarily unavailable — please try again in a moment')
  }

  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch (err) {
    console.error('Gemini returned non-JSON output for improve:', raw)
    throw ApiError.internal('AI improvement returned an unexpected response — please try again')
  }

  return normalizeAiResume(parsed, resumeText, { defaultTitle: 'Optimized Resume' })
}
