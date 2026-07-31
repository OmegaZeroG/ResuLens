// Dispatches to the right per-template PDF builder based on resume.template,
// then saves the result. Rebuilt from a single hardcoded layout into a
// dispatcher once template #2 (Jake's Resume) needed its own PDF export —
// each builder lays the resume out as real PDF text (not a screenshot) so
// links stay clickable and ATS software can actually parse the exported
// file, which was the whole reason the original single-layout version was
// rebuilt from html2canvas in the first place. See utils/pdf/pdfHelpers.js
// for the shared drawing primitives every builder is built on.
import { buildClassicPdf } from './pdf/classicPdf'
import { buildJakesResumePdf } from './pdf/jakesResumePdf'
import { buildCompactTwoColumnPdf } from './pdf/compactTwoColumnPdf'
import { buildModernPdf } from './pdf/modernPdf'
import { buildHarvardPdf } from './pdf/harvardPdf'

const BUILDERS = {
  default: buildClassicPdf,
  'jakes-resume': buildJakesResumePdf,
  'compact-two-column': buildCompactTwoColumnPdf,
  modern: buildModernPdf,
  harvard: buildHarvardPdf,
}

export async function exportResumeToPdf(resume, filename) {
  const build = BUILDERS[resume.template] || buildClassicPdf
  const doc = await build(resume)
  doc.save(filename)
}
