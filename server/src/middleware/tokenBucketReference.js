// A pure-JS mirror of TOKEN_BUCKET_SCRIPT's algorithm from rateLimiter.js,
// used ONLY by tests (rateLimiter.test.js mocks Redis's `eval` with this).
// Vitest can't execute the real Lua script directly without a real Redis
// server, so this exists to let the algorithm's correctness be verified by
// an automated, checked-in test instead of only by hand (which is how it was
// originally verified, in a throwaway scratch script, before this existed).
//
// IMPORTANT: this must stay byte-for-byte equivalent to TOKEN_BUCKET_SCRIPT's
// logic. It is never imported by production code — only by tests — so
// there's no risk of it silently replacing the real atomic Redis operation,
// but if you change the Lua script, change this to match or the tests will
// be validating a design that no longer reflects what actually runs.
//
// `store` is a Map standing in for Redis's keyspace, and `now` is an
// explicit seconds value standing in for Redis's TIME command — both passed
// in rather than using real time/state, so tests can control both precisely
// (advance the clock, isolate keys, reset between cases) without a real
// Redis connection.
export function simulateTokenBucket({ store, key, capacity, refillRate, cost, now }) {
  const bucket = store.get(key)
  let tokens = bucket?.tokens
  let ts = bucket?.ts

  if (tokens === undefined) {
    tokens = capacity
    ts = now
  }

  const elapsed = Math.max(0, now - ts)
  tokens = Math.min(capacity, tokens + elapsed * refillRate)

  let allowed = false
  if (tokens >= cost) {
    tokens -= cost
    allowed = true
  }

  store.set(key, { tokens, ts: now })

  let retryAfter = 0
  if (tokens < 1) {
    retryAfter = (1 - tokens) / refillRate
  }

  return { allowed, tokens, retryAfter }
}
