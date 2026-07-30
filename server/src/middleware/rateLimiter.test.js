import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocked before importing rateLimiter.js, so the middleware never touches a
// real Redis connection or a real Mongo connection — this tests
// rateLimiter.js's own logic (header setting, tiering, fail-open behavior,
// error handling, event logging) in isolation, using a fake Redis whose
// `eval` response is controlled per-test. The token-bucket *algorithm*
// itself is covered separately in tokenBucketReference.test.js.
const mockEval = vi.fn()
vi.mock('../config/redis.js', () => ({
  getRedisClient: () => mockGetRedisClient(),
}))
const mockGetRedisClient = vi.fn(() => ({ eval: mockEval }))

const mockCreate = vi.fn().mockResolvedValue({})
vi.mock('../models/RateLimitEvent.js', () => ({
  default: { create: (...args) => mockCreate(...args) },
}))

const { rateLimit } = await import('./rateLimiter.js')
const { default: ApiError } = await import('../utils/ApiError.js')

function makeReq(overrides = {}) {
  return { user: { _id: 'user123', plan: 'free' }, ...overrides }
}

function makeRes() {
  const headers = {}
  return {
    headers,
    setHeader: vi.fn((key, value) => {
      headers[key] = value
    }),
  }
}

describe('rateLimit middleware', () => {
  beforeEach(() => {
    mockEval.mockReset()
    mockGetRedisClient.mockReset().mockReturnValue({ eval: mockEval })
    mockCreate.mockClear()
  })

  it('skips limiting entirely when Redis is not configured (fail open)', async () => {
    mockGetRedisClient.mockReturnValue(null)
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(next).toHaveBeenCalledWith() // called with no error
    expect(res.setHeader).not.toHaveBeenCalled()
    expect(mockEval).not.toHaveBeenCalled()
  })

  it('skips limiting when there is no authenticated user (defensive — should never happen after requireAuth)', async () => {
    const req = makeReq({ user: undefined })
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(next).toHaveBeenCalledWith()
    expect(mockEval).not.toHaveBeenCalled()
  })

  it('allows the request through and sets the correct quota headers', async () => {
    mockEval.mockResolvedValue(['1', '3.5', '0'])
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(next).toHaveBeenCalledWith() // no error passed
    expect(res.headers['X-RateLimit-Limit']).toBe('5')
    expect(res.headers['X-RateLimit-Remaining']).toBe('3')
    expect(res.headers['X-RateLimit-Tier']).toBe('free')
    expect(res.headers['X-RateLimit-Reset']).toBeDefined()
  })

  it('logs a usage event on a successful check (fire-and-forget)', async () => {
    mockEval.mockResolvedValue(['1', '3.5', '0'])
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user123', route: 'analyze', allowed: true, tier: 'free', cost: 1 }),
    )
  })

  it('denies the request with a 429 ApiError and a Retry-After header when the bucket is empty', async () => {
    mockEval.mockResolvedValue(['0', '0', '720'])
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    const errArg = next.mock.calls[0][0]
    expect(errArg).toBeInstanceOf(ApiError)
    expect(errArg.statusCode).toBe(429)
    expect(res.headers['Retry-After']).toBe('720')
  })

  it('fails open (allows the request) if the Redis call itself throws', async () => {
    mockEval.mockRejectedValue(new Error('ECONNRESET'))
    const req = makeReq()
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(next).toHaveBeenCalledWith() // no error — request proceeds unlimited
  })

  it('uses the premium tier capacity for a premium user', async () => {
    mockEval.mockResolvedValue(['1', '29', '0'])
    const req = makeReq({ user: { _id: 'user123', plan: 'premium' } })
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(res.headers['X-RateLimit-Limit']).toBe('30')
    // ARGV[1] passed to EVAL should be the premium capacity.
    expect(mockEval).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.arrayContaining(['30']))
  })

  it('defaults to the free tier for an unrecognized/missing plan', async () => {
    mockEval.mockResolvedValue(['1', '4', '0'])
    const req = makeReq({ user: { _id: 'user123', plan: 'nonexistent-plan' } })
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    expect(res.headers['X-RateLimit-Limit']).toBe('5')
    expect(res.headers['X-RateLimit-Tier']).toBe('free')
  })

  it('passes the configured cost through to EVAL (e.g. Improve costing 2)', async () => {
    mockEval.mockResolvedValue(['1', '28', '0'])
    const req = makeReq({ user: { _id: 'user123', plan: 'premium' } })
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 2, route: 'improve' })(req, res, next)

    expect(mockEval).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.arrayContaining(['2']))
  })

  it('keys the Redis bucket per user, not globally', async () => {
    mockEval.mockResolvedValue(['1', '4', '0'])
    const req = makeReq({ user: { _id: 'abc999', plan: 'free' } })
    const res = makeRes()
    const next = vi.fn()

    await rateLimit({ cost: 1, route: 'analyze' })(req, res, next)

    const [, keys] = mockEval.mock.calls[0]
    expect(keys[0]).toContain('abc999')
  })
})
