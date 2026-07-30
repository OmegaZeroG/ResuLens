import { getAuthToken, notifyUnauthorized } from './authToken.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(extra = {}) {
  const token = getAuthToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

async function handleResponse(res) {
  if (res.status === 401) {
    notifyUnauthorized()
  }
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`)
  }
  return body?.data ?? null
}

// Resume side: pass either `resumeId` (one of your saved resumes) or `resumeFile`
// (a File object) — not both. JD side: pass either `jdText` or `jdFile`.
export async function analyze({ resumeId, resumeFile, jdText, jdFile }) {
  const formData = new FormData()
  if (resumeId) formData.append('resumeId', resumeId)
  if (resumeFile) formData.append('resumeFile', resumeFile)
  if (jdText) formData.append('jdText', jdText)
  if (jdFile) formData.append('jdFile', jdFile)

  const res = await fetch(`${API_BASE}/api/analyze`, {
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

  const res = await fetch(`${API_BASE}/api/analyze/improve`, {
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
