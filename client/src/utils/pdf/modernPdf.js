// PDF export matching ModernTemplate.jsx: a solid indigo header band (photo,
// name, contact in white) and pill-shaped skill badges. Page 2+ (if the
// resume overflows) is a plain white continuation — the header band, like
// compactTwoColumnPdf's sidebar, is a page-1-only visual flourish.
import { jsPDF } from 'jspdf'
import { withProtocol } from '../links'
import { getAvatarUrl } from '../imagekitTransform'
import {
  MARGIN_X,
  COLOR,
  setStyle,
  loadImageAsDataUrl,
  ensureSpace,
  wrappedParagraph,
  bulletList,
  entryHeaderRow,
  dateRange,
} from './pdfHelpers'

const MARGIN_Y = 40
const ACCENT = COLOR.indigo600

function accentHeading(ctx, title) {
  ensureSpace(ctx, 24)
  ctx.doc.setFillColor(...ACCENT)
  ctx.doc.rect(MARGIN_X, ctx.y - 7, 6, 6, 'F')
  setStyle(ctx.doc, { style: 'bold', size: 9.5, color: COLOR.slate700 })
  ctx.doc.setCharSpace(0.6)
  ctx.doc.text(title.toUpperCase(), MARGIN_X + 11, ctx.y)
  ctx.doc.setCharSpace(0)
  ctx.y += 14
}

export async function buildModernPdf(resume) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - MARGIN_X * 2
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Header band ----
  const headerHeight = 96
  doc.setFillColor(...COLOR.indigo600)
  doc.rect(0, 0, pageWidth, headerHeight, 'F')

  let nameX = MARGIN_X
  const photoDiameter = 50
  const photoY = 24
  if (resume.photoUrl) {
    try {
      const dataUrl = await loadImageAsDataUrl(getAvatarUrl(resume.photoUrl, { size: 300 }))
      const cx = MARGIN_X + photoDiameter / 2
      const cy = photoY + photoDiameter / 2
      doc.saveGraphicsState()
      doc.ellipse(cx, cy, photoDiameter / 2, photoDiameter / 2, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(dataUrl, 'PNG', MARGIN_X, photoY, photoDiameter, photoDiameter)
      doc.restoreGraphicsState()
      nameX = MARGIN_X + photoDiameter + 16
    } catch {
      // Skip the photo if the host doesn't allow canvas export.
    }
  }

  setStyle(doc, { style: 'bold', size: 19, color: COLOR.white })
  doc.text(contact.fullName || 'Your Name', nameX, 44)

  let cx2 = nameX
  const contactY = 62
  setStyle(doc, { size: 9, color: COLOR.indigo50 })
  const bits = [contact.phone, contact.email, contact.location].filter(Boolean)
  bits.forEach((bit, i) => {
    if (i > 0) {
      doc.text('   ·   ', cx2, contactY)
      cx2 += doc.getTextWidth('   ·   ')
    }
    if (bit === contact.email) {
      doc.textWithLink(bit, cx2, contactY, { url: `mailto:${contact.email}` })
    } else {
      doc.text(bit, cx2, contactY)
    }
    cx2 += doc.getTextWidth(bit)
  })

  const profileLinks = (contact.links || []).filter((l) => l.url)
  if (profileLinks.length) {
    let lx = nameX
    const linksY = 80
    setStyle(doc, { size: 8.5, color: COLOR.white })
    profileLinks.forEach((link, i) => {
      if (i > 0) {
        doc.text('   |   ', lx, linksY)
        lx += doc.getTextWidth('   |   ')
      }
      const w = doc.textWithLink(link.label || link.url, lx, linksY, { url: withProtocol(link.url) })
      lx += w
    })
  }

  const ctx = { doc, y: headerHeight + 26, pageWidth, pageHeight }

  if (summary) {
    accentHeading(ctx, 'Summary')
    wrappedParagraph(ctx, summary, { maxWidth: contentWidth })
    ctx.y += 8
  }

  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    accentHeading(ctx, 'Skills')
    // Pill badges, wrapping left to right — a real (if simplified) approximation
    // of the live preview's flex-wrap chip row.
    let px = MARGIN_X
    let rowH = 20
    setStyle(doc, { size: 8.5, color: COLOR.indigo600 })
    for (const skill of skillItems) {
      const textW = doc.getTextWidth(skill)
      const pillW = textW + 16
      if (px + pillW > MARGIN_X + contentWidth) {
        px = MARGIN_X
        ctx.y += rowH
        ensureSpace(ctx, rowH)
      }
      doc.setFillColor(...COLOR.indigo50)
      doc.roundedRect(px, ctx.y - 12, pillW, 16, 8, 8, 'F')
      doc.setTextColor(...COLOR.indigo600)
      doc.text(skill, px + 8, ctx.y - 1)
      px += pillW + 6
    }
    ctx.y += rowH + 4
  }

  if (experience?.length) {
    accentHeading(ctx, 'Experience')
    for (const exp of experience) {
      entryHeaderRow(
        ctx,
        [
          { text: exp.role || '', bold: true },
        ],
        dateRange(exp.startDate, exp.endDate, exp.current),
        { dateColor: COLOR.indigo600 },
      )
      const subtitle = [exp.company, exp.location].filter(Boolean).join(' · ')
      if (subtitle) {
        wrappedParagraph(ctx, subtitle, { maxWidth: contentWidth, size: 8.5, color: COLOR.slate500, lineHeight: 11 })
      }
      bulletList(ctx, exp.bullets, { maxWidth: contentWidth })
      ctx.y += 8
    }
  }

  if (education?.length) {
    accentHeading(ctx, 'Education')
    for (const edu of education) {
      const detail = [edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')
      entryHeaderRow(
        ctx,
        [
          { text: edu.school || '', bold: true },
          detail && { text: ` · ${detail}`, color: COLOR.slate600 },
        ].filter(Boolean),
        dateRange(edu.startDate, edu.endDate, false),
        { dateColor: COLOR.indigo600 },
      )
      if (edu.gpa) {
        wrappedParagraph(ctx, `GPA: ${edu.gpa}`, { maxWidth: contentWidth, size: 8.5, color: COLOR.slate500, lineHeight: 11 })
      }
      ctx.y += 5
    }
  }

  if (projects?.length) {
    accentHeading(ctx, 'Projects')
    for (const proj of projects) {
      ensureSpace(ctx, 13)
      setStyle(doc, { style: 'bold', size: 9.7, color: COLOR.slate900 })
      doc.text(proj.name || '', MARGIN_X, ctx.y)

      let linkX = ctx.pageWidth - MARGIN_X
      setStyle(doc, { size: 8.5, color: COLOR.indigo600 })
      if (proj.githubLink) {
        const w = doc.textWithLink('GitHub', linkX, ctx.y, { url: withProtocol(proj.githubLink), align: 'right' })
        linkX -= w
      }
      if (proj.liveLink && proj.githubLink) {
        doc.setTextColor(...COLOR.slate400)
        const sep = ' | '
        doc.text(sep, linkX - doc.getTextWidth(sep), ctx.y)
        linkX -= doc.getTextWidth(sep)
      }
      if (proj.liveLink) {
        doc.setTextColor(...COLOR.indigo600)
        doc.textWithLink('Live Demo', linkX, ctx.y, { url: withProtocol(proj.liveLink), align: 'right' })
      }
      ctx.y += 13

      if (proj.description) wrappedParagraph(ctx, proj.description, { maxWidth: contentWidth })
      bulletList(ctx, proj.bullets, { maxWidth: contentWidth })
      ctx.y += 8
    }
  }

  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    accentHeading(ctx, section.title || 'Additional Section')
    bulletList(ctx, section.bullets, { maxWidth: contentWidth })
    ctx.y += 5
  }

  return doc
}
