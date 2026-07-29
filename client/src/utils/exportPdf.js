// html2canvas-pro (not plain html2canvas) — the original library can't parse
// modern CSS color functions like oklch(), which is what Tailwind v4 outputs for
// every color utility by default. -pro is a maintained fork that adds support
// for oklch/oklab/lab/lch specifically for this reason. Same API otherwise.
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'

// Renders a DOM element to an image (html2canvas) and drops it into a jsPDF
// document, slicing across multiple A4 pages if the content is taller than one
// page. This captures the resume exactly as it looks in the live preview —
// same fonts, spacing, everything — rather than re-laying it out for print.
export async function exportElementToPdf(element, filename) {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  pdf.save(filename)
}
