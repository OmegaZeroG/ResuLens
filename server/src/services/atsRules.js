// Deterministic, rule-based half of the independent ATS score (see
// geminiAtsContent.js for the AI-judged content-quality half). These check
// things a real ATS parser actually chokes on — no Gemini call, free, and
// fully reliable for saved resumes since ResuLens's own structured data is
// ground truth. For an uploaded file, only the extracted plain text is
// available, so some checks fall back to text heuristics instead of exact
// structural knowledge — documented per-check below.

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[a-z]{2,}/i
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/
// Loose keyword match for standard resume section headings — good enough to
// tell "this resume has recognizable structure" from "this is a wall of
// undifferentiated text," which is exactly the distinction that matters for
// whether an ATS parser can segment it correctly.
const SECTION_KEYWORDS = {
  experience: /\b(experience|employment|work history)\b/i,
  education: /\beducation\b/i,
  skills: /\bskills\b/i,
}
// A conservative set of characters that are either purely decorative (and
// can render as garbage/mojibake in some ATS parsers) or are emoji — real
// bullet characters (•, -, *) are deliberately NOT included here since
// those are completely standard and expected.
const PROBLEMATIC_CHAR_RE = /[\u{1F300}-\u{1FAFF}✀-➿☀-⛿]/gu

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

// `sections` is only present for a saved resume (ResuLens's own structured
// data) — when present, checks use it directly instead of the text
// heuristics, since it's fully reliable ground truth rather than a guess.
export function runAtsRuleChecks({ resumeText, sections, resumeSource }) {
  const text = resumeText || ''
  const checks = []

  // Only meaningful for an upload — a resume built and exported through
  // ResuLens's own PDF generator always has a real text layer by
  // construction (see exportPdf.js), so this would always trivially pass
  // for a saved resume and isn't worth showing.
  if (resumeSource === 'upload') {
    const hasRealText = text.trim().length >= 150
    checks.push({
      id: 'extractable_text',
      label: 'Has a real, extractable text layer',
      pass: hasRealText,
      severity: 'critical',
      weight: 25,
      detail: hasRealText
        ? 'The file has real, machine-readable text.'
        : 'Almost no text could be extracted from this file. It may be a scanned image or a PDF exported without a real text layer — most ATS systems cannot read these at all, regardless of how the resume looks visually.',
    })
  }

  const hasEmail = EMAIL_RE.test(text)
  const hasPhone = PHONE_RE.test(text)
  checks.push({
    id: 'contact_info',
    label: 'Email and phone number are present',
    pass: hasEmail && hasPhone,
    severity: 'high',
    weight: 20,
    detail:
      hasEmail && hasPhone
        ? 'Both an email address and a phone number were found.'
        : `Missing ${[!hasEmail && 'an email address', !hasPhone && 'a phone number'].filter(Boolean).join(' and ')} — ATS systems and recruiters need this to be found automatically, not just visible on the page.`,
  })

  const hasExperience = sections ? (sections.experience || []).length > 0 : SECTION_KEYWORDS.experience.test(text)
  const hasEducation = sections ? (sections.education || []).length > 0 : SECTION_KEYWORDS.education.test(text)
  const hasSkills = sections ? (sections.skills || []).length > 0 : SECTION_KEYWORDS.skills.test(text)
  const missingSections = [!hasExperience && 'Experience', !hasEducation && 'Education', !hasSkills && 'Skills'].filter(
    Boolean,
  )
  checks.push({
    id: 'standard_sections',
    label: 'Has standard, recognizable sections',
    pass: missingSections.length === 0,
    severity: 'high',
    weight: 25,
    detail:
      missingSections.length === 0
        ? 'Experience, Education, and Skills sections were all found.'
        : `Missing or unrecognized: ${missingSections.join(', ')}. ATS parsers rely on standard section headings to correctly categorize your information — non-standard or missing headings can cause whole sections to be skipped.`,
  })

  const hasBullets = sections
    ? [...(sections.experience || []), ...(sections.projects || [])].some((entry) => entry.bullets?.length > 0)
    : /(^|\n)\s*[•\-*]\s+\S/.test(text)
  checks.push({
    id: 'bullet_usage',
    label: 'Uses bullet points for experience/project details',
    pass: hasBullets,
    severity: 'medium',
    weight: 15,
    detail: hasBullets
      ? 'Bullet points were found — these parse more reliably than dense paragraphs.'
      : 'No bullet points detected. Dense paragraphs are harder for both ATS parsers and human reviewers to scan quickly.',
  })

  const words = wordCount(text)
  const lengthOk = words >= 150 && words <= 1200
  checks.push({
    id: 'resume_length',
    label: 'Length is in a reasonable range',
    pass: lengthOk,
    severity: 'low',
    weight: 10,
    detail:
      words < 150
        ? `Only about ${words} words — this may be too thin to demonstrate real experience.`
        : words > 1200
          ? `About ${words} words — this is on the long side and may get truncated or skimmed.`
          : `About ${words} words — a reasonable length.`,
  })

  const problematicMatches = text.match(PROBLEMATIC_CHAR_RE) || []
  checks.push({
    id: 'no_problematic_characters',
    label: 'Avoids emoji/decorative characters',
    pass: problematicMatches.length === 0,
    severity: 'low',
    weight: 5,
    detail:
      problematicMatches.length === 0
        ? 'No emoji or decorative symbols found.'
        : `Found ${problematicMatches.length} emoji/decorative character${problematicMatches.length === 1 ? '' : 's'} — these can render as garbled text or be silently dropped by some ATS parsers.`,
  })

  const maxPoints = checks.reduce((sum, c) => sum + c.weight, 0)
  const earnedPoints = checks.reduce((sum, c) => sum + (c.pass ? c.weight : 0), 0)
  let score = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 100

  // A resume an ATS can't read at all is a critical failure that should
  // dominate the score, not just subtract 25 points from an otherwise-fine
  // total — everything else is moot if nothing could be extracted.
  const criticalFailure = checks.some((c) => c.severity === 'critical' && !c.pass)
  if (criticalFailure) {
    score = Math.min(score, 20)
  }

  return { score, checks }
}
