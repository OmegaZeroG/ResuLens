// PDF export matching JakesResumeTemplate.jsx: centered header, serif type
// throughout ('times' — jsPDF's built-in serif face, the closest match to
// the original LaTeX template's Computer Modern/Latin Modern without
// embedding a custom font), plain pipe-separated contact line (no icons),
// deliberately no photo (see the live-preview component for why), thin
// black rule under each heading, two-line entry headers.
import { jsPDF } from 'jspdf'
import { withProtocol } from '../links'
import {
  MARGIN_X,
  MARGIN_Y,
  COLOR,
  setStyle,
  ensureSpace,
  wrappedParagraph,
  bulletList,
  dateRange,
} from './pdfHelpers'

const FONT = 'times'

function centeredContactLine(ctx, contact) {
  const pieces = [
    contact.phone,
    contact.email,
    ...(contact.links || []).filter((l) => l.url),
  ].filter(Boolean)
  if (!pieces.length) return

  // Measure the whole line first so it can be centered as one unit, then
  // draw piece by piece (plain text or a real clickable link annotation)
  // left-to-right starting from that centered x.
  setStyle(ctx.doc, { font: FONT, size: 9.5, color: COLOR.slate600 })
  const sep = '   |   '
  const texts = pieces.map((p) => (typeof p === 'string' ? p : p.label || p.url))
  const totalWidth =
    texts.reduce((sum, t) => sum + ctx.doc.getTextWidth(t), 0) + ctx.doc.getTextWidth(sep) * (texts.length - 1)
  let x = (ctx.pageWidth - totalWidth) / 2

  pieces.forEach((piece, i) => {
    const isLink = typeof piece !== 'string'
    const text = isLink ? piece.label || piece.url : piece
    if (i > 0) {
      ctx.doc.setTextColor(...COLOR.slate400)
      ctx.doc.text(sep, x, ctx.y)
      x += ctx.doc.getTextWidth(sep)
    }
    ctx.doc.setTextColor(...COLOR.slate600)
    if (isLink) {
      ctx.doc.textWithLink(text, x, ctx.y, { url: withProtocol(piece.url) })
    } else if (piece === contact.email) {
      ctx.doc.textWithLink(text, x, ctx.y, { url: `mailto:${contact.email}` })
    } else {
      ctx.doc.text(text, x, ctx.y)
    }
    x += ctx.doc.getTextWidth(text)
  })
  ctx.y += 16
}

function jakesHeading(ctx, title) {
  ensureSpace(ctx, 24)
  setStyle(ctx.doc, { font: FONT, style: 'bold', size: 10.5, color: COLOR.slate900 })
  ctx.doc.text(title.toUpperCase(), MARGIN_X, ctx.y)
  ctx.y += 3
  ctx.doc.setDrawColor(...COLOR.slate800)
  ctx.doc.setLineWidth(0.7)
  ctx.doc.line(MARGIN_X, ctx.y, ctx.pageWidth - MARGIN_X, ctx.y)
  ctx.y += 13
}

// The two-line "title/dates then company/location" header used by
// Education, Experience, and Projects — mirrors JakesResumeTemplate.jsx's
// <EntryHeader>.
function entryHeader(ctx, { left, right, subLeft, subRight }) {
  ensureSpace(ctx, subLeft || subRight ? 24 : 13)
  setStyle(ctx.doc, { font: FONT, style: 'bold', size: 10, color: COLOR.slate900 })
  ctx.doc.text(left || '', MARGIN_X, ctx.y)
  if (right) {
    setStyle(ctx.doc, { font: FONT, style: 'bold', size: 9, color: COLOR.slate700 })
    ctx.doc.text(right, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
  }
  ctx.y += 12.5
  if (subLeft || subRight) {
    setStyle(ctx.doc, { font: FONT, style: 'italic', size: 9.5, color: COLOR.slate700 })
    if (subLeft) ctx.doc.text(subLeft, MARGIN_X, ctx.y)
    if (subRight) {
      setStyle(ctx.doc, { font: FONT, style: 'italic', size: 8.5, color: COLOR.slate500 })
      ctx.doc.text(subRight, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
    }
    ctx.y += 12
  }
}

export async function buildJakesResumePdf(resume) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ctx = { doc, y: MARGIN_Y, pageWidth: doc.internal.pageSize.getWidth(), pageHeight: doc.internal.pageSize.getHeight() }
  const contentWidth = ctx.pageWidth - MARGIN_X * 2
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Header: centered name + centered plain-text contact line, no photo ----
  setStyle(doc, { font: FONT, style: 'bold', size: 20, color: COLOR.slate900 })
  doc.text((contact.fullName || 'Your Name').toUpperCase(), ctx.pageWidth / 2, ctx.y, { align: 'center' })
  ctx.y += 20
  centeredContactLine(ctx, contact)
  ctx.y += 4

  if (summary) {
    jakesHeading(ctx, 'Summary')
    wrappedParagraph(ctx, summary, { maxWidth: contentWidth, font: FONT, lineHeight: 12.5 })
    ctx.y += 8
  }

  if (education?.length) {
    jakesHeading(ctx, 'Education')
    for (const edu of education) {
      entryHeader(ctx, {
        left: edu.school,
        right: dateRange(edu.startDate, edu.endDate, false),
        subLeft: [edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' '),
        subRight: edu.gpa && `GPA: ${edu.gpa}`,
      })
      ctx.y += 4
    }
    ctx.y += 4
  }

  if (experience?.length) {
    jakesHeading(ctx, 'Experience')
    for (const exp of experience) {
      entryHeader(ctx, {
        left: exp.role,
        right: dateRange(exp.startDate, exp.endDate, exp.current),
        subLeft: exp.company,
        subRight: exp.location,
      })
      bulletList(ctx, exp.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
      ctx.y += 6
    }
  }

  if (projects?.length) {
    jakesHeading(ctx, 'Projects')
    for (const proj of projects) {
      const links = [proj.liveLink, proj.githubLink].filter(Boolean).map(withProtocol)
      entryHeader(ctx, { left: proj.name, right: links.length ? links.join('  |  ') : '' })
      if (proj.description) {
        wrappedParagraph(ctx, proj.description, { maxWidth: contentWidth, font: FONT, size: 9, lineHeight: 11.5 })
      }
      bulletList(ctx, proj.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
      ctx.y += 6
    }
  }

  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    jakesHeading(ctx, 'Technical Skills')
    wrappedParagraph(ctx, skillItems.join(', '), { maxWidth: contentWidth, font: FONT, lineHeight: 12.5 })
    ctx.y += 8
  }

  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    jakesHeading(ctx, section.title || 'Additional')
    bulletList(ctx, section.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
    ctx.y += 6
  }

  return doc
}
