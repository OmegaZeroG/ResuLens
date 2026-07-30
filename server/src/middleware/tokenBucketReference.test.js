import { describe, it, expect, beforeEach } from 'vitest'
import { simulateTokenBucket } from './tokenBucketReference.js'

// These cases mirror exactly what was originally verified by hand in a
// throwaway Node scratch script when the rate limiter was first built (no
// real Redis available in that environment either) — formalized here as a
// real, checked-in, repeatable test instead of a one-off.
describe('token bucket algorithm', () => {
  let store

  beforeEach(() => {
    store = new Map()
  })

  it('allows a burst up to capacity, then denies the next request', () => {
    const capacity = 5
    const refillRate = 5 / 3600 // 5/hour
    const results = []
    for (let i = 0; i < 6; i++) {
      results.push(simulateTokenBucket({ store, key: 'user:A', capacity, refillRate, cost: 1, now: 1000 }))
    }
    expect(results.slice(0, 5).every((r) => r.allowed)).toBe(true)
    expect(results[5].allowed).toBe(false)
    expect(results[5].retryAfter).toBeGreaterThan(0)
  })

  it('reports a retryAfter that actually works — waiting that long allows the next request', () => {
    const capacity = 5
    const refillRate = 5 / 3600
    for (let i = 0; i < 5; i++) {
      simulateTokenBucket({ store, key: 'user:A', capacity, refillRate, cost: 1, now: 1000 })
    }
    const denied = simulateTokenBucket({ store, key: 'user:A', capacity, refillRate, cost: 1, now: 1000 })
    expect(denied.allowed).toBe(false)

    const later = 1000 + Math.ceil(denied.retryAfter) + 1
    const afterWaiting = simulateTokenBucket({ store, key: 'user:A', capacity, refillRate, cost: 1, now: later })
    expect(afterWaiting.allowed).toBe(true)
  })

  it('keeps different users completely isolated', () => {
    const capacity = 5
    const refillRate = 5 / 3600
    for (let i = 0; i < 5; i++) {
      simulateTokenBucket({ store, key: 'user:A', capacity, refillRate, cost: 1, now: 1000 })
    }
    // user:A is now fully drained — user:B, a fresh key, should be unaffected.
    const userB = simulateTokenBucket({ store, key: 'user:B', capacity, refillRate, cost: 1, now: 1000 })
    expect(userB.allowed).toBe(true)
    expect(userB.tokens).toBe(capacity - 1)
  })

  it('a cost-2 request (e.g. Improve) only allows half as many calls as cost-1', () => {
    const capacity = 30
    const refillRate = 30 / 3600
    let allowedCount = 0
    for (let i = 0; i < 20; i++) {
      const r = simulateTokenBucket({ store, key: 'user:C', capacity, refillRate, cost: 2, now: 2000 })
      if (r.allowed) allowedCount++
    }
    expect(allowedCount).toBe(15) // 15 * 2 = 30 = capacity
  })

  it('fully refills after exactly one hour of inactivity', () => {
    const capacity = 5
    const refillRate = 5 / 3600
    for (let i = 0; i < 5; i++) {
      simulateTokenBucket({ store, key: 'user:D', capacity, refillRate, cost: 1, now: 3000 })
    }
    expect(store.get('user:D').tokens).toBe(0)

    const oneHourLater = 3000 + 3600
    const result = simulateTokenBucket({ store, key: 'user:D', capacity, refillRate, cost: 1, now: oneHourLater })
    // Bucket was full (5) again right before this call consumed 1.
    expect(result.allowed).toBe(true)
    expect(result.tokens).toBe(capacity - 1)
  })

  it('never lets tokens exceed capacity even with a very long idle gap', () => {
    const capacity = 5
    const refillRate = 5 / 3600
    simulateTokenBucket({ store, key: 'user:E', capacity, refillRate, cost: 1, now: 0 })
    // Ten years later — refill math must clamp to capacity, not overflow.
    const tenYearsLater = 10 * 365 * 24 * 3600
    const result = simulateTokenBucket({ store, key: 'user:E', capacity, refillRate, cost: 1, now: tenYearsLater })
    expect(result.tokens).toBe(capacity - 1)
  })
})
