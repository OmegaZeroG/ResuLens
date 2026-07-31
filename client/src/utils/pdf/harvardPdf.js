// PDF export matching HarvardTemplate.jsx: pure black/white/gray serif,
// centered header, centered section labels flanked by rules, Education
// before Experience (academic CV convention). No photo, no color anywhere —
// the most formal and most conservative of the five templates on purpose.
import { jsPDF } from 'jspdf'
import { withProtocol } from '../links'
import {
  MARGIN_X,
  COLOR,
  setStyle,
  ensureSpace,
  wrappedParagraph,
  bulletList,
  dateRange,
} from './pdfHelpers'

const MARGIN_Y = 40
const FONT = 'times'

function centeredHeading(ctx, title) {
  ensureSpace(ctx, 26)
  const label = `  ${title.toUpperCase()}  `
  setStyle(ctx.doc, { font: FONT, style: 'bold', size: 10, color: COLOR.slate800 })
  const labelWidth = ctx.doc.getTextWidth(label)
  const centerX = ctx.pageWidth / 2
  const ruleColor = COLOR.slate400
  ctx.doc.setDrawColor(...ruleColor)
  ctx.doc.setLineWidth(0.6)
  ctx.doc.line(MARGIN_X, ctx.y - 3, centerX - labelWidth / 2, ctx.y - 3)
  ctx.doc.text(label, centerX, ctx.y, { align: 'center' })
  ctx.doc.line(centerX + labelWidth / 2, ctx.y - 3, ctx.pageWidth - MARGIN_X, ctx.y - 3)
  ctx.y += 15
}

function entryRow(ctx, { left, right, subLeft, subRight }) {
  ensureSpace(ctx, subLeft || subRight ? 24 : 13)
  setStyle(ctx.doc, { font: FONT, style: 'bold', size: 10, color: COLOR.slate900 })
  ctx.doc.text(left || '', MARGIN_X, ctx.y)
  if (right) {
    setStyle(ctx.doc, { font: FONT, size: 8.5, color: COLOR.slate600 })
    ctx.doc.text(right, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
  }
  ctx.y += 12.5
  if (subLeft || subRight) {
    setStyle(ctx.doc, { font: FONT, style: 'italic', size: 9, color: COLOR.slate700 })
    if (subLeft) ctx.doc.text(subLeft, MARGIN_X, ctx.y)
    if (subRight) {
      setStyle(ctx.doc, { font: FONT, style: 'italic', size: 8.5, color: COLOR.slate500 })
      ctx.doc.text(subRight, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
    }
    ctx.y += 12
  }
  ctx.y += 4
}

export async function buildHarvardPdf(resume) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ctx = { doc, y: MARGIN_Y, pageWidth: doc.internal.pageSize.getWidth(), pageHeight: doc.internal.pageSize.getHeight() }
  const contentWidth = ctx.pageWidth - MARGIN_X * 2
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Centered header ----
  setStyle(doc, { font: FONT, style: 'bold', size: 18, color: COLOR.slate900 })
  doc.setCharSpace(1.2)
  doc.text((contact.fullName || 'Your Name').toUpperCase(), ctx.pageWidth / 2, ctx.y, { align: 'center' })
  doc.setCharSpace(0)
  ctx.y += 8
  doc.setDrawColor(...COLOR.slate800)
  doc.setLineWidth(1)
  const ruleW = 60
  doc.line(ctx.pageWidth / 2 - ruleW / 2, ctx.y, ctx.pageWidth / 2 + ruleW / 2, ctx.y)
  ctx.y += 14

  const contactPieces = [contact.location, contact.phone, contact.email, ...(contact.links || []).filter((l) => l.url)]
    .filter(Boolean)
  if (contactPieces.length) {
    setStyle(doc, { font: FONT, size: 9, color: COLOR.slate600 })
    const sep = '   ·   '
    const texts = contactPieces.map((p) => (typeof p === 'string' ? p : p.label || p.url))
    const totalWidth = texts.reduce((s, t) => s + doc.getTextWidth(t), 0) + doc.getTextWidth(sep) * (texts.length - 1)
    let x = (ctx.pageWidth - totalWidth) / 2
    contactPieces.forEach((piece, i) => {
      const isLink = typeof piece !== 'string'
      const text = isLink ? piece.label || piece.url : piece
      if (i > 0) {
        doc.setTextColor(...COLOR.slate400)
        doc.text(sep, x, ctx.y)
        x += doc.getTextWidth(sep)
      }
      doc.setTextColor(...COLOR.slate600)
      if (isLink) doc.textWithLink(text, x, ctx.y, { url: withProtocol(piece.url) })
      else if (piece === contact.email) doc.textWithLink(text, x, ctx.y, { url: `mailto:${contact.email}` })
      else doc.text(text, x, ctx.y)
      x += doc.getTextWidth(text)
    })
    ctx.y += 18
  } else {
    ctx.y += 6
  }

  if (summary) {
    centeredHeading(ctx, 'Summary')
    wrappedParagraph(ctx, summary, { maxWidth: contentWidth, font: FONT, lineHeight: 12.5 })
    ctx.y += 6
  }

  if (education?.length) {
    centeredHeading(ctx, 'Education')
    for (const edu of education) {
      entryRow(ctx, {
        left: edu.school,
        right: dateRange(edu.startDate, edu.endDate, false),
        subLeft: [edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' '),
        subRight: edu.gpa && `GPA: ${edu.gpa}`,
      })
    }
  }

  if (experience?.length) {
    centeredHeading(ctx, 'Experience')
    for (const exp of experience) {
      entryRow(ctx, {
        left: exp.role,
        right: dateRange(exp.startDate, exp.endDate, exp.current),
        subLeft: exp.company,
        subRight: exp.location,
      })
      bulletList(ctx, exp.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
      ctx.y += 4
    }
  }

  if (projects?.length) {
    centeredHeading(ctx, 'Projects')
    for (const proj of projects) {
      const links = [proj.liveLink, proj.githubLink].filter(Boolean).map(withProtocol)
      entryRow(ctx, { left: proj.name, right: links.length ? links.join('  |  ') : '' })
      if (proj.description) {
        wrappedParagraph(ctx, proj.description, { maxWidth: contentWidth, font: FONT, size: 9, lineHeight: 11.5 })
      }
      bulletList(ctx, proj.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
      ctx.y += 4
    }
  }

  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    centeredHeading(ctx, 'Skills')
    setStyle(doc, { font: FONT, size: 9.5, color: COLOR.slate700 })
    const line = skillItems.join('  ·  ')
    const lines = doc.splitTextToSize(line, contentWidth)
    for (const l of lines) {
      ensureSpace(ctx, 12.5)
      doc.text(l, ctx.pageWidth / 2, ctx.y, { align: 'center' })
      ctx.y += 12.5
    }
    ctx.y += 4
  }

  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    centeredHeading(ctx, section.title || 'Additional')
    bulletList(ctx, section.bullets, { maxWidth: contentWidth, font: FONT, bulletColor: COLOR.slate600, lineHeight: 11.5 })
    ctx.y += 4
  }

  return doc
}
