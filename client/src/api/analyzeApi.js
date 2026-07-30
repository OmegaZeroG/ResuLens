import { getAuthToken, notifyUnauthorized } from './authToken.js'
import { captureRateLimitHeaders } from './rateLimitStore.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(extra = {}) {
  const token = getAuthToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

async function handleResponse(res) {
  if (res.status === 401) {
    notifyUnauthorized()
  }
  // Only analyze/improve responses carry these (see rateLimiter.js) — a
  // no-op on listAnalyses/getAnalysis, which don't set them.
  captureRateLimitHeaders(res)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`)
  }
  return body?.data ?? null
}

// The AI calls (analyze/improve) can occasionally run long. Without a client-
// side cap, a genuinely stuck connection just leaves the "Analyzing…"/
// "Rewriting…" button spinning forever with no feedback — this turns that
// into a clear, actionable error instead of an indefinite hang. 100s comfortably
// covers a normal slow response; if it's still not back by then, something's
// actually wrong rather than just taking a while.
const AI_TIMEOUT_MS = 100_000

async function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('This is taking longer than expected — please try again in a moment')
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// Resume side: pass either `resumeId` (one of your saved resumes) or `resumeFile`
// (a File object) — not both. JD side: pass either `jdText` or `jdFile`.
export async function analyze({ resumeId, resumeFile, jdText, jdFile }) {
  const formData = new FormData()
  if (resumeId) formData.append('resumeId', resumeId)
  if (resumeFile) formData.append('resumeFile', resumeFile)
  if (jdText) formData.append('jdText', jdText)
  if (jdFile) formData.append('jdFile', jdFile)

  const res = await fetchWithTimeout(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse(res)
}

// Same resume/JD inputs as analyze(), plus an optional missingKeywords hint
// (typically the missingKeywords array from a prior analyze() result) to
// help the rewrite target the actual gap. Returns { resume, analysis } — a
// brand new saved resume (the original is never touched) plus its freshly
// measured score against the same JD.
export async function improveResume({ resumeId, resumeFile, jdText, jdFile, missingKeywords }) {
  const formData = new FormData()
  if (resumeId) formData.append('resumeId', resumeId)
  if (resumeFile) formData.append('resumeFile', resumeFile)
  if (jdText) formData.append('jdText', jdText)
  if (jdFile) formData.append('jdFile', jdFile)
  if (missingKeywords?.length) formData.append('missingKeywords', JSON.stringify(missingKeywords))

  const res = await fetchWithTimeout(`${API_BASE}/api/analyze/improve`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })
  return handleResponse(res)
}

export async function listAnalyses() {
  const res = await fetch(`${API_BASE}/api/analyze`, { headers: authHeaders() })
  return handleResponse(res)
}

export async function getAnalysis(id) {
  const res = await fetch(`${API_BASE}/api/analyze/${id}`, { headers: authHeaders() })
  return handleResponse(res)
}

// { tier, limits: { capacity, refillPerHour }, last24h: { total, allowed, blocked }, recent: [...] }
export async function getUsageStats() {
  const res = await fetch(`${API_BASE}/api/analyze/usage/stats`, { headers: authHeaders() })
  return handleResponse(res)
}
