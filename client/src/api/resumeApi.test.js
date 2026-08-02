import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { listResumes, deleteResume, setAuthToken, setUnauthorizedHandler } from './resumeApi'

// Covers the shared request()/error pattern that every *Api.js module in
// this client uses (see the audit that fed into the loading/error UX pass):
// unwrap { success, data }, throw the server's real message on a non-ok
// response, and fire the global logout handler on a 401. request() itself
// isn't exported, so this drives it through the real exported functions
// with fetch mocked — closer to how the app actually calls it anyway.

function mockFetchOnce({ ok = true, status = 200, data = null, message } = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    status,
    url: 'http://localhost:5000/api/resume',
    json: () => Promise.resolve({ success: ok, statusCode: status, message, data }),
  })
}

describe('resumeApi request/error handling', () => {
  beforeEach(() => {
    setAuthToken(null)
    setUnauthorizedHandler(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('unwraps body.data on a successful response', async () => {
    mockFetchOnce({ ok: true, data: [{ _id: '1', title: 'My Resume' }] })
    const result = await listResumes()
    expect(result).toEqual([{ _id: '1', title: 'My Resume' }])
  })

  it('throws the server-provided message on a non-ok response', async () => {
    mockFetchOnce({ ok: false, status: 400, message: 'Title is required' })
    await expect(listResumes()).rejects.toThrow('Title is required')
  })

  it('falls back to a generic message when the server gives none', async () => {
    mockFetchOnce({ ok: false, status: 500, message: undefined })
    await expect(listResumes()).rejects.toThrow('Request failed with status 500')
  })

  it('attaches an Authorization header once a token is set', async () => {
    setAuthToken('test-token-123')
    mockFetchOnce({ ok: true, data: [] })
    await listResumes()

    const [, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBe('Bearer test-token-123')
  })

  it('sends no Authorization header when no token is set', async () => {
    mockFetchOnce({ ok: true, data: [] })
    await listResumes()

    const [, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBeUndefined()
  })

  it('fires the registered unauthorized handler on a 401, in addition to throwing', async () => {
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    mockFetchOnce({ ok: false, status: 401, message: 'Invalid or expired token' })

    await expect(deleteResume('abc')).rejects.toThrow('Invalid or expired token')
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
