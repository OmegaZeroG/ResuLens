import { PDFParse } from 'pdf-parse'
import mammoth from 'mammoth'
import ApiError from './ApiError.js'

const PDF_MIME = 'application/pdf'
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const TXT_MIME = 'text/plain'

export const ALLOWED_DOCUMENT_MIMES = new Set([PDF_MIME, DOCX_MIME, TXT_MIME])

// Extracts plain text from an uploaded PDF, DOCX, or plain-text file. Used for
// analyzing an uploaded resume/JD against each other, and later for the
// "import from old resume" flow that prefills the builder.
export async function extractTextFromFile(file) {
  if (!file) return ''

  if (file.mimetype === PDF_MIME) {
    const parser = new PDFParse({ data: new Uint8Array(file.buffer) })
    try {
      // pdf-parse defaults to inserting a "-- page_number of total_number --"
      // marker between pages, which would just be noise fed into the Gemini
      // prompt — turn it off.
      const result = await parser.getText({ pageJoiner: '' })
      return (result.text || '').trim()
    } finally {
      await parser.destroy()
    }
  }

  if (file.mimetype === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer: file.buffer })
    return (result.value || '').trim()
  }

  if (file.mimetype === TXT_MIME) {
    return file.buffer.toString('utf-8').trim()
  }

  throw ApiError.badRequest('Unsupported file type — upload a PDF, DOCX, or plain text file')
}

// Turns a saved Resume document's structured sections into plain text, so
// analysis can run the same way whether the source is an uploaded file or a
// resume already built in ResuLens — the Gemini prompt just sees text either way.
export function serializeResumeToText(resume) {
  const sections = resume.sections || {}
  const lines = []

  if (sections.contact?.fullName) lines.push(sections.contact.fullName)
  const contactLine = [
    sections.contact?.email,
    sections.contact?.phone,
    sections.contact?.location,
    sections.contact?.linkedin,
    sections.contact?.portfolio,
  ]
    .filter(Boolean)
    .join(' | ')
  if (contactLine) lines.push(contactLine)
  if (sections.summary) lines.push('', 'Summary:', sections.summary)

  if (sections.skills?.length) {
    lines.push('', 'Skills:', sections.skills.join(', '))
  }

  if (sections.experience?.length) {
    lines.push('', 'Experience:')
    for (const exp of sections.experience) {
      const range = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' - ')
      const header = `${exp.role || ''} at ${exp.company || ''}${range ? ` (${range})` : ''}`.trim()
      if (header) lines.push(header)
      for (const bullet of exp.bullets || []) lines.push(`- ${bullet}`)
    }
  }

  if (sections.education?.length) {
    lines.push('', 'Education:')
    for (const edu of sections.education) {
      const range = [edu.startDate, edu.endDate].filter(Boolean).join(' - ')
      const line = `${edu.degree || ''} ${edu.fieldOfStudy || ''}, ${edu.school || ''}${range ? ` (${range})` : ''}`.trim()
      if (line) lines.push(line)
    }
  }

  if (sections.projects?.length) {
    lines.push('', 'Projects:')
    for (const proj of sections.projects) {
      const links = [proj.liveLink, proj.githubLink].filter(Boolean).join(', ')
      const header = `${proj.name || ''}${links ? ` (${links})` : ''}`.trim()
      if (header) lines.push(header)
      if (proj.description) lines.push(proj.description)
      for (const bullet of proj.bullets || []) lines.push(`- ${bullet}`)
    }
  }

  if (sections.customSections?.length) {
    for (const section of sections.customSections) {
      if (!section.title && !section.bullets?.length) continue
      lines.push('', `${section.title || 'Additional Section'}:`)
      for (const bullet of section.bullets || []) lines.push(`- ${bullet}`)
    }
  }

  return lines.join('\n').trim()
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
const LINKEDIN_RE = /(https?:\/\/)?(www\.)?linkedin\.com\/[^\s,)]+/i
const GITHUB_RE = /(https?:\/\/)?(www\.)?github\.com\/[^\s,)]+/i

// Deterministic, non-AI fallback for pulling contact details straight out of
// raw resume text with regex. Used as a safety net when an AI rewrite/import
// leaves a contact field blank — email/phone/LinkedIn/GitHub are reliably
// pattern-matchable, so there's no reason to depend on the model catching
// them every time.
export function extractContactHints(text) {
  if (!text) return {}
  return {
    email: text.match(EMAIL_RE)?.[0],
    phone: text.match(PHONE_RE)?.[0]?.trim(),
    linkedin: text.match(LINKEDIN_RE)?.[0],
    portfolio: text.match(GITHUB_RE)?.[0],
  }
}
