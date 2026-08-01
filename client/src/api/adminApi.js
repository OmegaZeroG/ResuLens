import { getAuthToken, notifyUnauthorized } from './authToken.js'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function authHeaders(extra = {}) {
  const token = getAuthToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

// Same shape as resumeApi.js's request() — unwraps the standard
// { success, statusCode, message, data } envelope, fires the global
// auto-logout handler on a 401.
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/admin${path}`, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json', ...(options.headers || {}) }),
  })

  if (res.status === 401) {
    console.warn(`[adminApi] 401 on ${res.url} — logging out`)
    notifyUnauthorized()
  }

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.message || `Request failed with status ${res.status}`)
  }

  return body?.data ?? null
}

export function listUsers(q = '') {
  const query = q ? `?q=${encodeURIComponent(q)}` : ''
  return request(`/users${query}`)
}

export function getStats() {
  return request('/stats')
}

export function getUserDetail(id) {
  return request(`/users/${id}`)
}

export function updateUserPlan(id, plan) {
  return request(`/users/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) })
}

export function setUserActive(id, isActive) {
  return request(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ isActive }) })
}

export function resetUserRateLimit(id) {
  return request(`/users/${id}/reset-limit`, { method: 'POST' })
}

export function deleteUser(id) {
  return request(`/users/${id}`, { method: 'DELETE' })
}
