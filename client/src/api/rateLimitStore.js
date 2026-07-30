// Tiny module-level pub-sub, not React state, so `analyzeApi.js` (a plain
// module, not a component) can write into it whenever an /api/analyze
// response carries X-RateLimit-* headers, and any component can subscribe
// without threading this through props. Same "no state library, just the
// simplest thing that works" approach as the rest of the client.
let info = null
const listeners = new Set()

export function setRateLimitInfo(next) {
  info = next
  listeners.forEach((fn) => fn(info))
}

export function getRateLimitInfo() {
  return info
}

export function subscribeRateLimitInfo(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Reads the quota headers off a fetch Response, if present (only
// /api/analyze and /api/analyze/improve set them — see rateLimiter.js) and
// updates the shared store. Safe to call on every response, including
// non-OK ones (a 429 still carries the headers, and that's the most useful
// moment to show them).
export function captureRateLimitHeaders(res) {
  const limit = res.headers.get('X-RateLimit-Limit')
  if (limit === null) return // not a rate-limited endpoint, or limiting is disabled server-side
  setRateLimitInfo({
    limit: Number(limit),
    remaining: Number(res.headers.get('X-RateLimit-Remaining')),
    resetAt: Number(res.headers.get('X-RateLimit-Reset')) * 1000, // seconds -> ms
    tier: res.headers.get('X-RateLimit-Tier') || 'free',
  })
}
