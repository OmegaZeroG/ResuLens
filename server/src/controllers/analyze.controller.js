import Resume from '../models/Resume.js'
import Analysis from '../models/Analysis.js'
import RateLimitEvent from '../models/RateLimitEvent.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import isValidObjectId from '../utils/isValidObjectId.js'
import { extractTextFromFile, serializeResumeToText } from '../utils/resumeText.js'
import { analyzeResumeAgainstJD } from '../services/geminiAnalysis.js'
import { improveResumeForJD } from '../services/geminiImprove.js'
import { runAtsRuleChecks } from '../services/atsRules.js'
import { scoreResumeContent } from '../services/geminiAtsContent.js'
import { TIERS } from '../middleware/rateLimiter.js'

// Shared by analyze/improve — resolves resumeText from either an uploaded
// file or one of the user's saved resumes. Throws if neither is usable.
// `resume` (the plain sections object) is only present for a saved resume —
// improve() uses it as ground truth to guard against the AI silently
// dropping real content.
async function resolveResumeText(req, resumeFile, resumeId) {
  if (resumeFile) {
    return { resumeText: await extractTextFromFile(resumeFile), resumeSource: 'upload' }
  }
  if (!isValidObjectId(resumeId)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id })
  if (!resume) throw ApiError.notFound('Resume not found')
  return {
    resumeText: serializeResumeToText(resume),
    resumeSource: 'saved',
    resumeId: resume._id,
    originalSections: resume.toObject().sections,
  }
}

// Even with explicit prompt instructions not to drop content, an LLM rewrite
// isn't guaranteed to follow them — in practice it has been observed to
// silently omit an entire section (e.g. projects) it judged "less relevant"
// to the target job. When we have the original saved resume as ground truth,
// never trust the AI for factual identity (company/school/project names,
// dates, contact info) — only accept its rewritten summary/skills, and its
// rewritten bullets when the entry count didn't change (so we can safely
// assume position-for-position correspondence).
function mergeEntries(originalList, improvedList, extraFields = []) {
  if (!originalList?.length) return improvedList || []
  if (!Array.isArray(improvedList) || improvedList.length !== originalList.length) {
    // Counts don't match — can't safely tell what the AI kept vs. dropped
    // vs. added, so keep every original entry untouched rather than risk
    // silently losing one.
    return originalList
  }
  return originalList.map((orig, i) => {
    const rewritten = improvedList[i] || {}
    const merged = { ...orig }
    if (Array.isArray(rewritten.bullets) && rewritten.bullets.length) {
      merged.bullets = rewritten.bullets
    }
    for (const field of extraFields) {
      if (rewritten[field]) merged[field] = rewritten[field]
    }
    return merged
  })
}

// Exported for testing — not used outside this file otherwise.
export function mergeWithOriginal(original, improved) {
  return {
    contact: original.contact, // facts, never AI-generated
    summary: improved.summary || original.summary,
    skills: improved.skills?.length ? improved.skills : original.skills,
    experience: mergeEntries(original.experience, improved.experience),
    education: original.education, // degrees/dates are facts, no upside to rewriting
    projects: mergeEntries(original.projects, improved.projects, ['description']),
    customSections: mergeEntries(original.customSections || [], improved.customSections),
  }
}

// Resume side: either an uploaded file (resumeFile) or a resume you already
// saved in ResuLens (resumeId) — not both, but at least one.
// JD side: either an uploaded file (jdFile) or pasted text (jdText).
export const analyze = asyncHandler(async (req, res) => {
  const { resumeId, jdText: jdTextBody } = req.body
  const resumeFile = req.files?.resumeFile?.[0]
  const jdFile = req.files?.jdFile?.[0]

  if (!resumeFile && !resumeId) {
    throw ApiError.badRequest('Provide either a resume file or one of your saved resumes')
  }
  if (!jdFile && !jdTextBody?.trim()) {
    throw ApiError.badRequest('Provide a job description — paste it in or upload a file')
  }

  const { resumeText, resumeSource, resumeId: resolvedResumeId } = await resolveResumeText(
    req,
    resumeFile,
    resumeId,
  )
  const jdText = jdFile ? await extractTextFromFile(jdFile) : jdTextBody.trim()

  const result = await analyzeResumeAgainstJD(resumeText, jdText)

  const analysis = await Analysis.create({
    userId: req.user._id,
    resumeId: resolvedResumeId,
    resumeSource,
    jdText,
    ...result,
  })

  new ApiResponse(201, analysis, 'Analysis complete').send(res)
})

// Rewrites the resume to better target the job description (truthful
// rephrasing/reordering only — see geminiImprove's prompt for the guardrails),
// saves the result as a brand new resume (never overwrites the original), and
// immediately re-scores the new resume against the same JD so the response
// reports a real, freshly-measured score rather than an unverified claim.
export const improve = asyncHandler(async (req, res) => {
  const { resumeId, jdText: jdTextBody, missingKeywords: missingKeywordsRaw } = req.body
  const resumeFile = req.files?.resumeFile?.[0]
  const jdFile = req.files?.jdFile?.[0]

  if (!resumeFile && !resumeId) {
    throw ApiError.badRequest('Provide either a resume file or one of your saved resumes')
  }
  if (!jdFile && !jdTextBody?.trim()) {
    throw ApiError.badRequest('Provide a job description — paste it in or upload a file')
  }

  const { resumeText, originalSections } = await resolveResumeText(req, resumeFile, resumeId)
  const jdText = jdFile ? await extractTextFromFile(jdFile) : jdTextBody.trim()

  let missingKeywords = []
  if (missingKeywordsRaw) {
    try {
      const parsed = JSON.parse(missingKeywordsRaw)
      if (Array.isArray(parsed)) missingKeywords = parsed.filter((k) => typeof k === 'string')
    } catch {
      // Malformed hint — not critical, just proceed without it.
    }
  }

  const improved = await improveResumeForJD(resumeText, jdText, missingKeywords)

  // If the source was a saved resume, use it as ground truth so the AI can
  // never drop or fabricate factual content — see mergeWithOriginal above.
  // An uploaded file has no such ground truth to fall back on; that path
  // trusts the AI's extraction the same way an "import" flow would.
  const sections = originalSections ? mergeWithOriginal(originalSections, improved.sections) : improved.sections

  const newResume = await Resume.create({
    title: improved.title,
    sections,
    userId: req.user._id,
  })

  const newResult = await analyzeResumeAgainstJD(serializeResumeToText(newResume), jdText)
  const newAnalysis = await Analysis.create({
    userId: req.user._id,
    resumeId: newResume._id,
    resumeSource: 'saved',
    jdText,
    ...newResult,
  })

  new ApiResponse(201, { resume: newResume, analysis: newAnalysis }, 'Improved resume created').send(res)
})

// Independent ATS score — NOT tied to any job description (contrast with
// analyze() above, which scores match against a specific JD). Hybrid design:
// deterministic rule checks (atsRules.js — free, reliable, catches things a
// real ATS parser actually chokes on) combined with an AI-judged
// content-quality score (geminiAtsContent.js — the one thing rules can't
// reliably judge). Works on either a saved resume or an uploaded file, same
// resolveResumeText() helper as analyze/improve. Not persisted (no history) —
// this is a quick check-in-the-moment tool, unlike the JD-matched Analyze
// flow which is deliberately saved for later reference.
export const scoreAts = asyncHandler(async (req, res) => {
  const { resumeId } = req.body
  const resumeFile = req.files?.resumeFile?.[0]

  if (!resumeFile && !resumeId) {
    throw ApiError.badRequest('Provide either a resume file or one of your saved resumes')
  }

  const { resumeText, resumeSource, originalSections } = await resolveResumeText(req, resumeFile, resumeId)

  const { score: structureScore, checks: structureChecks } = runAtsRuleChecks({
    resumeText,
    sections: originalSections,
    resumeSource,
  })
  const { contentScore, strengths, weaknesses, suggestions } = await scoreResumeContent(resumeText)

  const overallScore = Math.round((structureScore + contentScore) / 2)

  new ApiResponse(
    200,
    {
      overallScore,
      structureScore,
      contentScore,
      structureChecks,
      content: { strengths, weaknesses, suggestions },
      resumeSource,
    },
    'ATS score computed',
  ).send(res)
})

export const listAnalyses = asyncHandler(async (req, res) => {
  const analyses = await Analysis.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50)
  new ApiResponse(200, analyses, 'Analyses fetched').send(res)
})

export const getAnalysis = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid analysis id')
  }
  const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user._id })
  if (!analysis) throw ApiError.notFound('Analysis not found')
  new ApiResponse(200, analysis, 'Analysis fetched').send(res)
})

// Self-service usage view — a user's own rate-limit history, not a
// cross-account admin panel (ResuLens has no admin role; every other screen
// in the app is already scoped to req.user the same way). Reads from
// RateLimitEvent, which is a pure usage log written by rateLimiter.js —
// Redis remains the only source of truth for whether a request was actually
// allowed, this just makes that history visible instead of invisible.
export const getUsageStats = asyncHandler(async (req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const [counts, recent] = await Promise.all([
    RateLimitEvent.aggregate([
      { $match: { userId: req.user._id, createdAt: { $gte: since } } },
      { $group: { _id: '$allowed', count: { $sum: 1 } } },
    ]),
    RateLimitEvent.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20),
  ])

  const allowed = counts.find((c) => c._id === true)?.count || 0
  const blocked = counts.find((c) => c._id === false)?.count || 0

  const tier = TIERS[req.user.plan] ? req.user.plan : 'free'

  new ApiResponse(
    200,
    {
      tier,
      limits: TIERS[tier],
      last24h: { total: allowed + blocked, allowed, blocked },
      recent,
    },
    'Usage stats fetched',
  ).send(res)
})
