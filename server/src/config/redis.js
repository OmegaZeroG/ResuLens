import { Redis } from '@upstash/redis'

let client = null
let warnedMissingConfig = false

// Lazily constructed, same pattern as Gemini/ImageKit's clients — but unlike
// those, missing config here does NOT throw. Rate limiting is a protective
// feature, not a core one: if Upstash isn't set up yet, every AI call should
// still work (just unlimited) rather than the whole app breaking until
// Redis is configured. The one-time console warning makes sure that's a
// deliberate, visible tradeoff and not something that gets silently
// forgotten before a real deploy.
export function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    if (!warnedMissingConfig) {
      console.warn(
        '[rateLimiter] UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — rate limiting is DISABLED (every request is allowed, no quota enforced). Add your Upstash Redis REST credentials to server/.env to turn it on.',
      )
      warnedMissingConfig = true
    }
    return null
  }

  if (!client) {
    client = new Redis({ url, token })
  }
  return client
}
