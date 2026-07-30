// Shared module-level auth token + 401 handler, so every API module (resumeApi,
// analyzeApi, ...) reads from one source of truth instead of each keeping its
// own copy in sync. useAuth.jsx is the only thing that writes here, via
// resumeApi's re-exported setAuthToken/setUnauthorizedHandler (kept for
// backwards compatibility so nothing else has to change its imports).
let token = null
let unauthorizedHandler = null

export function setAuthToken(t) {
  token = t
}

export function getAuthToken() {
  return token
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler
}

export function notifyUnauthorized() {
  unauthorizedHandler?.()
}
