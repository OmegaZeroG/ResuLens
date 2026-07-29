const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}/api/resume${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (res.status === 204) return null

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`)
  }

  return data
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
