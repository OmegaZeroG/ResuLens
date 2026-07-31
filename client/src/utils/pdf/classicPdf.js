// The original (and default) template's PDF layout — moved here unchanged
// from the old single-file exportPdf.js once a second template needed its
// own PDF export. See pdfHelpers.js for the shared drawing primitives this
// builds on.
import { jsPDF } from 'jspdf'
import { withProtocol } from '../links'
import { getAvatarUrl } from '../imagekitTransform'
import {
  MARGIN_X,
  MARGIN_Y,
  LINE_GAP,
  COLOR,
  setStyle,
  loadImageAsDataUrl,
  sectionHeading,
  wrappedParagraph,
  bulletList,
  entryHeaderRow,
  dateRange,
  contactLineRight,
  twoColumnSkills,
} from './pdfHelpers'

export async function buildClassicPdf(resume) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ctx = { doc, y: MARGIN_Y, pageWidth: doc.internal.pageSize.getWidth(), pageHeight: doc.internal.pageSize.getHeight() }
  const contentWidth = ctx.pageWidth - MARGIN_X * 2
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Header: photo (optional) + name on the left, contact stack on the right ----
  let nameX = MARGIN_X
  const photoDiameter = 54
  if (resume.photoUrl) {
    try {
      const dataUrl = await loadImageAsDataUrl(getAvatarUrl(resume.photoUrl, { size: 320 }))
      const cx = MARGIN_X + photoDiameter / 2
      const cy = MARGIN_Y + photoDiameter / 2
      doc.saveGraphicsState()
      doc.ellipse(cx, cy, photoDiameter / 2, photoDiameter / 2, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(dataUrl, 'PNG', MARGIN_X, MARGIN_Y, photoDiameter, photoDiameter)
      doc.restoreGraphicsState()
      nameX = MARGIN_X + photoDiameter + 14
    } catch {
      // Cross-origin photo host didn't allow canvas export — skip the photo.
    }
  }
  const nameY = MARGIN_Y + photoDiameter / 2 + 5
  setStyle(doc, { style: 'bold', size: 19, color: COLOR.slate900 })
  doc.setCharSpace(0.4)
  doc.text((contact.fullName || 'Your Name').toUpperCase(), nameX, nameY)
  doc.setCharSpace(0)

  const profileLinks = (contact.links || []).filter((l) => l.url)
  const linksY = nameY + 16
  if (profileLinks.length) {
    let x = nameX
    setStyle(doc, { style: 'normal', size: 8.5, color: COLOR.indigo600 })
    profileLinks.forEach((link, i) => {
      if (i > 0) {
        doc.setTextColor(...COLOR.slate400)
        doc.text(' | ', x, linksY)
        x += doc.getTextWidth(' | ')
        doc.setTextColor(...COLOR.indigo600)
      }
      const w = doc.textWithLink(link.label || link.url, x, linksY, { url: withProtocol(link.url) })
      x += w
    })
  }

  ctx.y = MARGIN_Y
  contactLineRight(ctx, contact.phone, contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`)
  contactLineRight(ctx, contact.email, contact.email && `mailto:${contact.email}`)
  contactLineRight(ctx, contact.location)

  ctx.y = Math.max(ctx.y, MARGIN_Y + photoDiameter, profileLinks.length ? linksY + 6 : 0) + 8
  doc.setDrawColor(...COLOR.slate900)
  doc.setLineWidth(1.4)
  doc.line(MARGIN_X, ctx.y, ctx.pageWidth - MARGIN_X, ctx.y)
  ctx.y += 20

  if (summary) {
    sectionHeading(ctx, 'Professional Summary')
    wrappedParagraph(ctx, summary, { maxWidth: contentWidth })
    ctx.y += 8
  }

  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    sectionHeading(ctx, 'Skills')
    twoColumnSkills(ctx, skillItems, contentWidth)
  }

  if (education?.length) {
    sectionHeading(ctx, 'Education')
    for (const edu of education) {
      const detail = [edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')
      entryHeaderRow(
        ctx,
        [
          { text: edu.school || '', bold: true },
          detail && { text: ` · ${detail}`, color: COLOR.slate600 },
        ].filter(Boolean),
        dateRange(edu.startDate, edu.endDate, false),
      )
      if (edu.gpa) {
        wrappedParagraph(ctx, `GPA: ${edu.gpa}`, { maxWidth: contentWidth, size: 8.5, color: COLOR.slate500, lineHeight: 11 })
      }
      ctx.y += LINE_GAP
    }
    ctx.y += 5
  }

  if (experience?.length) {
    sectionHeading(ctx, 'Experience')
    for (const exp of experience) {
      entryHeaderRow(
        ctx,
        [
          { text: exp.role || '', bold: true },
          exp.company && { text: ` · ${exp.company}`, color: COLOR.slate600 },
        ].filter(Boolean),
        dateRange(exp.startDate, exp.endDate, exp.current),
      )
      if (exp.location) {
        wrappedParagraph(ctx, exp.location, { maxWidth: contentWidth, size: 8.5, color: COLOR.slate500, lineHeight: 11 })
      }
      bulletList(ctx, exp.bullets, { maxWidth: contentWidth })
      ctx.y += 8
    }
    ctx.y += 2
  }

  if (projects?.length) {
    sectionHeading(ctx, 'Projects')
    for (const proj of projects) {
      ensureSpaceForRow(ctx)
      setStyle(doc, { style: 'bold', size: 9.7, color: COLOR.slate900 })
      doc.text(proj.name || '', MARGIN_X, ctx.y)

      let linkX = ctx.pageWidth - MARGIN_X
      setStyle(doc, { style: 'normal', size: 8.5, color: COLOR.indigo600 })
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

      if (proj.description) {
        wrappedParagraph(ctx, proj.description, { maxWidth: contentWidth })
      }
      bulletList(ctx, proj.bullets, { maxWidth: contentWidth })
      ctx.y += 8
    }
  }

  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    sectionHeading(ctx, section.title || 'Additional Section')
    bulletList(ctx, section.bullets, { maxWidth: contentWidth })
    ctx.y += 5
  }

  return doc
}

// Local alias — projects loop needs a plain 13pt reservation before drawing,
// same as entryHeaderRow's own check, but this loop draws its row by hand
// (for the GitHub/Live Demo link row) rather than via entryHeaderRow.
function ensureSpaceForRow(ctx) {
  if (ctx.y + 13 > ctx.pageHeight - MARGIN_Y) {
    ctx.doc.addPage()
    ctx.y = MARGIN_Y
  }
}
