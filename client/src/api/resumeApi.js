import {
  setAuthToken,
  getAuthToken,
  setUnauthorizedHandler,
  notifyUnauthorized,
} from './authToken.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Re-exported so useAuth.jsx's existing imports keep working — the actual
// token now lives in authToken.js, shared with analyzeApi.js and any future
// API module.
export { setAuthToken, setUnauthorizedHandler }

function authHeaders(extra = {}) {
  const token = getAuthToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

// Import goes through the same AI extraction path (geminiImport.js) that was
// found to occasionally run long (see analyzeApi.js's AI_TIMEOUT_MS for the
// full story) — same cap, so a stuck import fails clearly instead of leaving
// "Importing…" spinning forever.
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

// Server responses are wrapped in { success, statusCode, message, data } (see
// server/src/utils/ApiResponse.js and ApiError.js) — unwrap .data here so the
// rest of the client just works with plain resume objects.
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/resume${path}`, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) }),
  })

  if (res.status === 401) {
    // A 401 here fires the global auto-logout handler in useAuth.jsx. Kept
    // as a real console.warn (not removed after the OAuth bug was fixed) —
    // an unexpected 401 elsewhere in the app is still worth knowing about
    // immediately rather than silently bouncing the user to the login screen.
    console.warn(`[resumeApi] 401 on ${res.url} — logging out`)
    notifyUnauthorized()
  }

  if (res.status === 204) return null

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`)
  }

  return body?.data ?? null
}

export function listResumes() {
  return request('')
}

export function getResume(id) {
  return request(`/${id}`)
}

export function createResume(payload) {
  return request('', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateResume(id, payload) {
  return request(`/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteResume(id) {
  return request(`/${id}`, { method: 'DELETE' })
}

// Multipart upload — deliberately doesn't go through request()'s JSON Content-Type
// header. The browser sets the correct multipart boundary itself when you pass a
// FormData body and leave Content-Type unset.
export async function uploadResumePhoto(id, file) {
  const formData = new FormData()
  formData.append('photo', file)

  const res = await fetch(`${API_BASE}/api/resume/${id}/photo`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Upload failed with status ${res.status}`)
  }

  return body?.data ?? null
}

export function removeResumePhoto(id) {
  return request(`/${id}/photo`, { method: 'DELETE' })
}

// Multipart upload, same reasoning as uploadResumePhoto — let the browser set
// the multipart Content-Type/boundary itself. Returns the newly created,
// AI-prefilled resume so the caller can jump straight into editing it.
export async function importResume(file) {
  const formData = new FormData()
  formData.append('resumeFile', file)

  const res = await fetchWithTimeout(`${API_BASE}/api/resume/import`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })

  if (res.status === 401) {
    notifyUnauthorized()
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Import failed with status ${res.status}`)
  }

  return body?.data ?? null
}
