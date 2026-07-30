// jsPDF ships `jsPDF` as a named export, not a default export — `import
// jsPDF from 'jspdf'` silently grabs the wrong thing (an object, not the
// constructor) and throws "jsPDF is not a constructor" the moment it's used.
import { jsPDF } from 'jspdf'
import { withProtocol } from './links'

// Rebuilt from scratch to lay the resume out as real PDF text instead of
// screenshotting the live preview (the old approach used html2canvas + an
// embedded PNG). Two real problems with the screenshot approach drove this:
//   1. Links can't be clickable in a flattened image.
//   2. More importantly: a screenshot PDF has no real text layer at all, so
//      ATS systems — the entire point of an ATS-optimization tool — can't
//      parse the resume's text out of the downloaded file. Shipping that
//      silently would have undermined the app's core premise.
// This does mean the exported PDF isn't a pixel-perfect twin of the on-screen
// preview (different renderer, Helvetica instead of the web font, no little
// SVG icons) — it's a from-scratch layout aiming for the same structure and
// feel, built with jsPDF's own drawing primitives.

const MARGIN_X = 40
const MARGIN_Y = 40
const LINE_GAP = 3

const COLOR = {
  slate900: [15, 23, 42],
  slate700: [51, 65, 85],
  slate600: [71, 85, 105],
  slate500: [100, 116, 139],
  slate400: [148, 163, 184],
  indigo600: [79, 70, 229],
}

function setStyle(doc, { style = 'normal', size = 10, color = COLOR.slate700 } = {}) {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
}

// Loads a (possibly cross-origin) image URL as a PNG data URL by drawing it
// through a canvas — same technique the old html2canvas export relied on
// (`useCORS: true`) for pulling ImageKit photos into an export. If the host
// doesn't allow it, the canvas comes back "tainted" and toDataURL throws —
// caught by the caller, which just skips the photo rather than failing the
// whole export over a decorative image.
function loadImageAsDataUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Could not load photo'))
    img.src = url
  })
}

// Advances to a new page if the next block won't fit in what's left —
// natural pagination instead of the old approach's fixed-height image
// slicing, so a resume never gets an almost-empty trailing page.
function ensureSpace(ctx, needed) {
  if (ctx.y + needed > ctx.pageHeight - MARGIN_Y) {
    ctx.doc.addPage()
    ctx.y = MARGIN_Y
  }
}

function sectionHeading(ctx, title) {
  ensureSpace(ctx, 26)
  setStyle(ctx.doc, { style: 'bold', size: 9.5, color: COLOR.slate700 })
  ctx.doc.setCharSpace(0.6)
  ctx.doc.text(title.toUpperCase(), MARGIN_X, ctx.y)
  ctx.doc.setCharSpace(0)
  ctx.y += 4
  ctx.doc.setDrawColor(...COLOR.indigo600)
  ctx.doc.setLineWidth(1.1)
  ctx.doc.line(MARGIN_X, ctx.y, ctx.pageWidth - MARGIN_X, ctx.y)
  ctx.y += 14
}

// Wraps a paragraph to a width and draws it, advancing y as it goes —
// checking space page-by-page so a long paragraph can straddle a page break
// cleanly instead of getting cut off mid-line.
function wrappedParagraph(ctx, text, { x = MARGIN_X, maxWidth, size = 9.5, style = 'normal', color = COLOR.slate700, lineHeight = 13 } = {}) {
  if (!text) return
  setStyle(ctx.doc, { style, size, color })
  const lines = ctx.doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    ensureSpace(ctx, lineHeight)
    ctx.doc.text(line, x, ctx.y)
    ctx.y += lineHeight
  }
}

// A bullet list with a hanging indent — wrapped lines line up under the text,
// not under the bullet glyph, matching the live preview's `list-disc` look.
function bulletList(ctx, bullets, { x = MARGIN_X, maxWidth, size = 9.5, color = COLOR.slate700, lineHeight = 12.5 } = {}) {
  const items = (bullets || []).filter(Boolean)
  if (!items.length) return
  const indent = 12
  for (const bullet of items) {
    setStyle(ctx.doc, { size, color })
    const lines = ctx.doc.splitTextToSize(bullet, maxWidth - indent)
    ensureSpace(ctx, lineHeight)
    ctx.doc.setFillColor(...COLOR.indigo600)
    ctx.doc.circle(x + 2, ctx.y - 3, 1.2, 'F')
    ctx.doc.text(lines[0] || '', x + indent, ctx.y)
    ctx.y += lineHeight
    for (const line of lines.slice(1)) {
      ensureSpace(ctx, lineHeight)
      ctx.doc.text(line, x + indent, ctx.y)
      ctx.y += lineHeight
    }
  }
}

// Draws a left run of styled segments (e.g. bold role + normal company) and
// a right-aligned date on the same baseline — the PDF equivalent of the
// preview's `flex justify-between` header rows.
function entryHeaderRow(ctx, segments, dateText) {
  ensureSpace(ctx, 13)
  let x = MARGIN_X
  for (const seg of segments) {
    if (!seg.text) continue
    setStyle(ctx.doc, { style: seg.bold ? 'bold' : 'normal', size: 9.7, color: seg.color || COLOR.slate900 })
    ctx.doc.text(seg.text, x, ctx.y)
    x += ctx.doc.getTextWidth(seg.text)
  }
  if (dateText) {
    setStyle(ctx.doc, { style: 'normal', size: 8.5, color: COLOR.slate500 })
    ctx.doc.text(dateText, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
  }
  ctx.y += 13
}

function dateRange(startDate, endDate, current) {
  const end = current ? 'Present' : endDate
  if (startDate && end) return `${startDate} – ${end}`
  return startDate || end || ''
}

// One line of the header contact block — right-aligned, and a real clickable
// PDF link annotation (not just styled text) when a url is given.
function contactLine(ctx, text, url) {
  if (!text) return
  setStyle(ctx.doc, { size: 8.5, color: COLOR.slate500 })
  const x = ctx.pageWidth - MARGIN_X
  if (url) {
    ctx.doc.setTextColor(...COLOR.slate500)
    ctx.doc.textWithLink(text, x, ctx.y, { url, align: 'right' })
  } else {
    ctx.doc.text(text, x, ctx.y, { align: 'right' })
  }
  ctx.y += 12.5
}

export async function exportResumeToPdf(resume, filename) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const ctx = { doc, y: MARGIN_Y, pageWidth: doc.internal.pageSize.getWidth(), pageHeight: doc.internal.pageSize.getHeight() }
  const contentWidth = ctx.pageWidth - MARGIN_X * 2
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Header: photo (optional) + name on the left, contact stack on the right ----
  let nameX = MARGIN_X
  const photoDiameter = 54
  if (resume.photoUrl) {
    try {
      const dataUrl = await loadImageAsDataUrl(resume.photoUrl)
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
      // Cross-origin photo host didn't allow canvas export, or failed to
      // load — the photo just doesn't appear rather than failing the export.
    }
  }
  setStyle(doc, { style: 'bold', size: 19, color: COLOR.slate900 })
  doc.setCharSpace(0.4)
  doc.text((contact.fullName || 'Your Name').toUpperCase(), nameX, MARGIN_Y + photoDiameter / 2 + 5)
  doc.setCharSpace(0)

  ctx.y = MARGIN_Y
  contactLine(ctx, contact.phone, contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`)
  contactLine(ctx, contact.email, contact.email && `mailto:${contact.email}`)
  contactLine(ctx, contact.location)
  contactLine(ctx, contact.linkedin, contact.linkedin && withProtocol(contact.linkedin))
  contactLine(ctx, contact.portfolio, contact.portfolio && withProtocol(contact.portfolio))

  ctx.y = Math.max(ctx.y, MARGIN_Y + photoDiameter) + 8
  doc.setDrawColor(...COLOR.slate900)
  doc.setLineWidth(1.4)
  doc.line(MARGIN_X, ctx.y, ctx.pageWidth - MARGIN_X, ctx.y)
  ctx.y += 20

  // ---- Professional Summary ----
  if (summary) {
    sectionHeading(ctx, 'Professional Summary')
    wrappedParagraph(ctx, summary, { maxWidth: contentWidth })
    ctx.y += 8
  }

  // ---- Skills (two columns, same as the live preview) ----
  // Known limitation: the two columns are drawn as two independent passes
  // sharing one `doc`, so if the left column alone is long enough to trigger
  // a mid-section page break, the right column (drawn second) would start on
  // the new page instead of lining up next to the left column on the
  // original one. Reserving generous space up front makes this effectively
  // never happen for a real resume's skill list; a proper fix would need a
  // true two-pass layout (measure both columns, decide the page break once,
  // then draw) — more machinery than a skills list realistically needs.
  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    ensureSpace(ctx, 26 + Math.ceil(skillItems.length / 2) * 12.5 + 20)
    sectionHeading(ctx, 'Skills')
    const colWidth = (contentWidth - 24) / 2
    const col2X = MARGIN_X + colWidth + 24
    const mid = Math.ceil(skillItems.length / 2)
    const startY = ctx.y
    const leftCtx = { ...ctx, y: startY }
    bulletList(leftCtx, skillItems.slice(0, mid), { x: MARGIN_X, maxWidth: colWidth })
    const rightCtx = { ...ctx, y: startY }
    bulletList(rightCtx, skillItems.slice(mid), { x: col2X, maxWidth: colWidth })
    ctx.y = Math.max(leftCtx.y, rightCtx.y) + 8
  }

  // ---- Education ----
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

  // ---- Experience ----
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

  // ---- Projects (with real clickable Live Demo / GitHub links) ----
  if (projects?.length) {
    sectionHeading(ctx, 'Projects')
    for (const proj of projects) {
      ensureSpace(ctx, 13)
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

  // ---- Custom sections ----
  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    sectionHeading(ctx, section.title || 'Additional Section')
    bulletList(ctx, section.bullets, { maxWidth: contentWidth })
    ctx.y += 5
  }

  doc.save(filename)
}
