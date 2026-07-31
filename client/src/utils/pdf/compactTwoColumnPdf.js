// PDF export matching CompactTwoColumnTemplate.jsx: a filled dark sidebar
// (photo, contact, skills, education) beside a white main column (summary,
// experience, projects).
//
// Known simplification: the dark sidebar background is only drawn on page
// 1. A true multi-page two-column layout would need to track the sidebar
// and main column as independently-paginated regions and redraw the sidebar
// fill on every page it spans — real machinery for a case that's rare in
// practice (this template is dense enough that most resumes fit on one
// page). If the main column overflows onto a second page, that page is
// drawn as a plain full-width page rather than continuing the two-column
// look — a graceful simplification, not a crash or missing content.
import { jsPDF } from 'jspdf'
import { withProtocol } from '../links'
import { getAvatarUrl } from '../imagekitTransform'
import { loadImageAsDataUrl, dateRange } from './pdfHelpers'

const SIDEBAR_COLOR = [30, 41, 59] // slate-800
const SIDEBAR_TEXT = [203, 213, 225] // slate-300
const SIDEBAR_HEADING = [165, 180, 252] // indigo-300
const MAIN_MARGIN_X = 40
const MARGIN_Y = 40

function setStyle(doc, { style = 'normal', size = 10, color = [51, 65, 85] } = {}) {
  doc.setFont('helvetica', style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
}

export async function buildCompactTwoColumnPdf(resume) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const sidebarWidth = pageWidth * 0.34
  const sidebarPad = 22
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  // ---- Sidebar (page 1 only, see module note) ----
  doc.setFillColor(...SIDEBAR_COLOR)
  doc.rect(0, 0, sidebarWidth, pageHeight, 'F')

  let sy = MARGIN_Y
  const sidebarInnerWidth = sidebarWidth - sidebarPad * 2

  if (resume.photoUrl) {
    try {
      const dataUrl = await loadImageAsDataUrl(getAvatarUrl(resume.photoUrl, { size: 240 }))
      const d = 64
      const cx = sidebarWidth / 2
      doc.saveGraphicsState()
      doc.ellipse(cx, sy + d / 2, d / 2, d / 2, null)
      doc.clip()
      doc.discardPath()
      doc.addImage(dataUrl, 'PNG', cx - d / 2, sy, d, d)
      doc.restoreGraphicsState()
      sy += d + 10
    } catch {
      // Skip the photo if the host doesn't allow canvas export.
    }
  }
  setStyle(doc, { style: 'bold', size: 13, color: [255, 255, 255] })
  const nameLines = doc.splitTextToSize((contact.fullName || 'Your Name').toUpperCase(), sidebarInnerWidth)
  for (const line of nameLines) {
    doc.text(line, sidebarWidth / 2, sy, { align: 'center' })
    sy += 15
  }
  sy += 12

  function sidebarHeading(title) {
    setStyle(doc, { style: 'bold', size: 9, color: SIDEBAR_HEADING })
    doc.setCharSpace(0.5)
    doc.text(title.toUpperCase(), sidebarPad, sy)
    doc.setCharSpace(0)
    sy += 12
  }

  function sidebarLine(text, url) {
    if (!text) return
    setStyle(doc, { size: 8.5, color: SIDEBAR_TEXT })
    const lines = doc.splitTextToSize(text, sidebarInnerWidth)
    for (const line of lines) {
      if (url) doc.textWithLink(line, sidebarPad, sy, { url })
      else doc.text(line, sidebarPad, sy)
      sy += 11
    }
  }

  sidebarHeading('Contact')
  sidebarLine(contact.phone, contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`)
  sidebarLine(contact.email, contact.email && `mailto:${contact.email}`)
  sidebarLine(contact.location)
  for (const link of (contact.links || []).filter((l) => l.url)) {
    sidebarLine(link.label || link.url, withProtocol(link.url))
  }
  sy += 10

  const skillItems = (skills || []).filter(Boolean)
  if (skillItems.length) {
    sidebarHeading('Skills')
    setStyle(doc, { size: 8.5, color: SIDEBAR_TEXT })
    for (const skill of skillItems) {
      const lines = doc.splitTextToSize(skill, sidebarInnerWidth)
      for (const line of lines) {
        doc.text(line, sidebarPad, sy)
        sy += 11
      }
    }
    sy += 10
  }

  if (education?.length) {
    sidebarHeading('Education')
    for (const edu of education) {
      setStyle(doc, { style: 'bold', size: 8.5, color: [255, 255, 255] })
      for (const line of doc.splitTextToSize(edu.school || '', sidebarInnerWidth)) {
        doc.text(line, sidebarPad, sy)
        sy += 10.5
      }
      const detail = [edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')
      if (detail) {
        setStyle(doc, { size: 8, color: SIDEBAR_TEXT })
        for (const line of doc.splitTextToSize(detail, sidebarInnerWidth)) {
          doc.text(line, sidebarPad, sy)
          sy += 10
        }
      }
      const dates = dateRange(edu.startDate, edu.endDate, false)
      if (dates) {
        setStyle(doc, { size: 7.5, color: [148, 163, 184] })
        doc.text(dates, sidebarPad, sy)
        sy += 13
      } else {
        sy += 4
      }
    }
  }

  // ---- Main column ----
  const mainX = sidebarWidth + MAIN_MARGIN_X
  const mainWidth = pageWidth - mainX - MAIN_MARGIN_X
  const ctx = { doc, y: MARGIN_Y, mainX, mainWidth, pageWidth, pageHeight, onSecondPage: false }

  function ensure(needed) {
    if (ctx.y + needed > ctx.pageHeight - MARGIN_Y) {
      doc.addPage()
      ctx.y = MARGIN_Y
      ctx.onSecondPage = true
    }
  }
  function x() {
    return ctx.onSecondPage ? MAIN_MARGIN_X : ctx.mainX
  }
  function w() {
    return ctx.onSecondPage ? pageWidth - MAIN_MARGIN_X * 2 : ctx.mainWidth
  }

  function mainHeading(title) {
    ensure(24)
    setStyle(doc, { style: 'bold', size: 9.5, color: [51, 65, 85] })
    doc.setCharSpace(0.6)
    doc.text(title.toUpperCase(), x(), ctx.y)
    doc.setCharSpace(0)
    ctx.y += 4
    doc.setDrawColor(79, 70, 229)
    doc.setLineWidth(1.1)
    doc.line(x(), ctx.y, x() + w(), ctx.y)
    ctx.y += 13
  }

  function paragraph(text, size = 9.5, color = [51, 65, 85]) {
    if (!text) return
    setStyle(doc, { size, color })
    for (const line of doc.splitTextToSize(text, w())) {
      ensure(12.5)
      doc.text(line, x(), ctx.y)
      ctx.y += 12.5
    }
  }

  function bullets(items) {
    const list = (items || []).filter(Boolean)
    for (const bullet of list) {
      setStyle(doc, { size: 9, color: [51, 65, 85] })
      const lines = doc.splitTextToSize(bullet, w() - 12)
      ensure(12)
      doc.setFillColor(79, 70, 229)
      doc.circle(x() + 2, ctx.y - 3, 1.2, 'F')
      doc.text(lines[0] || '', x() + 12, ctx.y)
      ctx.y += 12
      for (const line of lines.slice(1)) {
        ensure(12)
        doc.text(line, x() + 12, ctx.y)
        ctx.y += 12
      }
    }
  }

  if (summary) {
    mainHeading('Summary')
    paragraph(summary)
    ctx.y += 8
  }

  if (experience?.length) {
    mainHeading('Experience')
    for (const exp of experience) {
      ensure(13)
      setStyle(doc, { style: 'bold', size: 9.7, color: [15, 23, 42] })
      doc.text(exp.role || '', x(), ctx.y)
      const dates = dateRange(exp.startDate, exp.endDate, exp.current)
      if (dates) {
        setStyle(doc, { size: 8.5, color: [100, 116, 139] })
        doc.text(dates, x() + w(), ctx.y, { align: 'right' })
      }
      ctx.y += 12
      const subtitle = [exp.company, exp.location].filter(Boolean).join(' · ')
      if (subtitle) {
        paragraph(subtitle, 8.5, [100, 116, 139])
      }
      bullets(exp.bullets)
      ctx.y += 8
    }
  }

  if (projects?.length) {
    mainHeading('Projects')
    for (const proj of projects) {
      ensure(13)
      setStyle(doc, { style: 'bold', size: 9.7, color: [15, 23, 42] })
      doc.text(proj.name || '', x(), ctx.y)
      ctx.y += 12
      if (proj.description) paragraph(proj.description, 9, [51, 65, 85])
      bullets(proj.bullets)
      ctx.y += 8
    }
  }

  for (const section of customSections || []) {
    if (!section.title && !(section.bullets || []).filter(Boolean).length) continue
    mainHeading(section.title || 'Additional Section')
    bullets(section.bullets)
    ctx.y += 5
  }

  return doc
}
