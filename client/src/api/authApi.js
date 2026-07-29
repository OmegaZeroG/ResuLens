export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Google/GitHub sign-in are full-page redirects (window.location.href = ...),
// not fetch() calls — the browser navigates to the backend, which redirects to
// the provider, which redirects back. No CORS involved at any point.
export const googleAuthUrl = `${API_BASE}/api/auth/google`
export const githubAuthUrl = `${API_BASE}/api/auth/github`

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options
  const res = await fetch(`${API_BASE}/api/auth${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`)
  }

  return body?.data ?? null
}

export function signup({ name, email, password }) {
  return request('/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) })
}

export function login({ email, password }) {
  return request('/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

// Used on app load to check whether a stored token is still valid and to fetch
// the current user. Takes the token explicitly rather than relying on resumeApi's
// module-level token, since this runs before that's guaranteed to be set.
export function getMe(token) {
  return request('/me', { headers: { Authorization: `Bearer ${token}` } })
}
