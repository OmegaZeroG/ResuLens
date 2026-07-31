// Shared low-level jsPDF drawing primitives, used by every per-template PDF
// builder (classicPdf.js, jakesResumePdf.js, etc.). Pulled out of the
// original single exportPdf.js once a second template needed PDF export —
// keeping one copy of "how to wrap a paragraph" / "how to draw a bullet
// list" means five templates can each have a genuinely different layout
// without five copies of the same text-wrapping logic to keep in sync.

export const MARGIN_X = 40
export const MARGIN_Y = 40
export const LINE_GAP = 3

export const COLOR = {
  slate900: [15, 23, 42],
  slate800: [30, 41, 59],
  slate700: [51, 65, 85],
  slate600: [71, 85, 105],
  slate500: [100, 116, 139],
  slate400: [148, 163, 184],
  slate200: [226, 232, 240],
  slate100: [241, 245, 249],
  white: [255, 255, 255],
  indigo600: [79, 70, 229],
  indigo500: [99, 102, 241],
  indigo50: [238, 242, 255],
}

export function setStyle(doc, { font = 'helvetica', style = 'normal', size = 10, color = COLOR.slate700 } = {}) {
  doc.setFont(font, style)
  doc.setFontSize(size)
  doc.setTextColor(...color)
}

// Loads a (possibly cross-origin) image URL as a PNG data URL by drawing it
// through a canvas — needed to embed an ImageKit-hosted photo into the PDF.
// If the host doesn't allow it, the canvas comes back "tainted" and
// toDataURL throws — caught by the caller, which just skips the photo
// rather than failing the whole export over a decorative image.
export function loadImageAsDataUrl(url) {
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
// natural pagination so a resume never gets an almost-empty trailing page.
export function ensureSpace(ctx, needed) {
  if (ctx.y + needed > ctx.pageHeight - MARGIN_Y) {
    ctx.doc.addPage()
    ctx.y = MARGIN_Y
  }
}

// A bold, letter-spaced section label with a rule underneath — the classic
// "section divider" look. `ruleColor`/`font` let each template reskin this
// (e.g. Jake's Resume wants a plain black rule and a serif font, Modern
// wants no rule at all with an accent-colored label) without a copy of this
// function per template.
export function sectionHeading(ctx, title, { ruleColor = COLOR.indigo600, font = 'helvetica', color = COLOR.slate700, drawRule = true } = {}) {
  ensureSpace(ctx, 26)
  setStyle(ctx.doc, { font, style: 'bold', size: 9.5, color })
  ctx.doc.setCharSpace(0.6)
  ctx.doc.text(title.toUpperCase(), MARGIN_X, ctx.y)
  ctx.doc.setCharSpace(0)
  ctx.y += 4
  if (drawRule) {
    ctx.doc.setDrawColor(...ruleColor)
    ctx.doc.setLineWidth(1.1)
    ctx.doc.line(MARGIN_X, ctx.y, ctx.pageWidth - MARGIN_X, ctx.y)
  }
  ctx.y += 14
}

// Wraps a paragraph to a width and draws it, advancing y as it goes —
// checking space page-by-page so a long paragraph can straddle a page break
// cleanly instead of getting cut off mid-line.
export function wrappedParagraph(ctx, text, { x = MARGIN_X, maxWidth, size = 9.5, style = 'normal', font = 'helvetica', color = COLOR.slate700, lineHeight = 13 } = {}) {
  if (!text) return
  setStyle(ctx.doc, { font, style, size, color })
  const lines = ctx.doc.splitTextToSize(text, maxWidth)
  for (const line of lines) {
    ensureSpace(ctx, lineHeight)
    ctx.doc.text(line, x, ctx.y)
    ctx.y += lineHeight
  }
}

// A bullet list with a hanging indent — wrapped lines line up under the
// text, not under the bullet glyph.
export function bulletList(ctx, bullets, { x = MARGIN_X, maxWidth, size = 9.5, font = 'helvetica', color = COLOR.slate700, bulletColor = COLOR.indigo600, lineHeight = 12.5 } = {}) {
  const items = (bullets || []).filter(Boolean)
  if (!items.length) return
  const indent = 12
  for (const bullet of items) {
    setStyle(ctx.doc, { font, size, color })
    const lines = ctx.doc.splitTextToSize(bullet, maxWidth - indent)
    ensureSpace(ctx, lineHeight)
    ctx.doc.setFillColor(...bulletColor)
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
// a right-aligned date on the same baseline.
export function entryHeaderRow(ctx, segments, dateText, { font = 'helvetica', dateColor = COLOR.slate500 } = {}) {
  ensureSpace(ctx, 13)
  let x = MARGIN_X
  for (const seg of segments) {
    if (!seg.text) continue
    setStyle(ctx.doc, { font, style: seg.bold ? 'bold' : 'normal', size: 9.7, color: seg.color || COLOR.slate900 })
    ctx.doc.text(seg.text, x, ctx.y)
    x += ctx.doc.getTextWidth(seg.text)
  }
  if (dateText) {
    setStyle(ctx.doc, { font, style: 'normal', size: 8.5, color: dateColor })
    ctx.doc.text(dateText, ctx.pageWidth - MARGIN_X, ctx.y, { align: 'right' })
  }
  ctx.y += 13
}

export function dateRange(startDate, endDate, current) {
  const end = current ? 'Present' : endDate
  if (startDate && end) return `${startDate} – ${end}`
  return startDate || end || ''
}

// One line of a right-aligned contact block — a real clickable PDF link
// annotation (not just styled text) when a url is given.
export function contactLineRight(ctx, text, url, { font = 'helvetica', color = COLOR.slate500 } = {}) {
  if (!text) return
  setStyle(ctx.doc, { font, size: 8.5, color })
  const x = ctx.pageWidth - MARGIN_X
  if (url) {
    ctx.doc.setTextColor(...color)
    ctx.doc.textWithLink(text, x, ctx.y, { url, align: 'right' })
  } else {
    ctx.doc.text(text, x, ctx.y, { align: 'right' })
  }
  ctx.y += 12.5
}

// Skills as a two-column bullet list sharing one section — used by several
// templates. See the known two-pass-pagination limitation noted where the
// original implementation lived (classicPdf.js): if the left column alone
// is long enough to trigger a page break mid-section, the right column
// would start on the new page rather than lining up beside the left one.
// Not a real-world problem for a normal skills list.
export function twoColumnSkills(ctx, skillItems, contentWidth, opts = {}) {
  if (!skillItems.length) return
  ensureSpace(ctx, 26 + Math.ceil(skillItems.length / 2) * 12.5 + 20)
  const colWidth = (contentWidth - 24) / 2
  const col2X = MARGIN_X + colWidth + 24
  const mid = Math.ceil(skillItems.length / 2)
  const startY = ctx.y
  const leftCtx = { ...ctx, y: startY }
  bulletList(leftCtx, skillItems.slice(0, mid), { x: MARGIN_X, maxWidth: colWidth, ...opts })
  const rightCtx = { ...ctx, y: startY }
  bulletList(rightCtx, skillItems.slice(mid), { x: col2X, maxWidth: colWidth, ...opts })
  ctx.y = Math.max(leftCtx.y, rightCtx.y) + 8
}
