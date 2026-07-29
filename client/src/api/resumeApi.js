const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Every /api/resume route requires a Bearer token now (see server/src/routes/resume.routes.js).
// The token lives in useAuth's state; it calls setAuthToken() whenever it changes so this
// module-level variable always reflects the current session without every call site having
// to pass it through manually.
let authToken = null
export function setAuthToken(token) {
  authToken = token
}

// If a request comes back 401 (expired/invalid token, or user deleted server-side),
// useAuth registers a handler here so the app can log the user out automatically
// instead of leaving them stuck on a screen full of failed requests.
let unauthorizedHandler = null
export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

function authHeaders(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra
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
    unauthorizedHandler?.()
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
    unauthorizedHandler?.()
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
