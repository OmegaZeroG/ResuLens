import ApiError from '../utils/ApiError.js'
import { getRedisClient } from '../config/redis.js'
import RateLimitEvent from '../models/RateLimitEvent.js'

// Tiered by User.plan (already a real field on the User model — 'free' or
// 'premium', not something invented for this). Both fields are per-hour
// numbers: `capacity` is the bucket size (max burst), `refillPerHour` is the
// sustained rate. Equal here on purpose (a plain hourly quota, smoothed by
// the token bucket instead of a hard reset at the top of every hour) — kept
// as two separate fields instead of one so a future tier could allow a
// bigger burst than its sustained rate without any code changes.
// Exported so analyze.controller.js's usage-stats endpoint can show a user
// their plan's actual limit numbers without duplicating them.
export const TIERS = {
  free: { capacity: 5, refillPerHour: 5 },
  premium: { capacity: 30, refillPerHour: 30 },
}
const DEFAULT_TIER = 'free'

// Atomic check-and-decrement token bucket, run server-side in Redis via
// EVAL so concurrent requests from the same user can't race each other into
// both being allowed (the classic read-then-write rate-limiter bug). Uses
// Redis's own clock (TIME) rather than the app server's, so limiting stays
// correct even if the two clocks drift.
//
// KEYS[1] = bucket key (a Redis hash: { tokens, ts })
// ARGV[1] = capacity (max tokens)
// ARGV[2] = refill rate, tokens per second
// ARGV[3] = cost of this request, in tokens
// ARGV[4] = key TTL in seconds (so an inactive user's bucket key eventually expires)
//
// Returns: { allowed (1/0), tokensRemaining, secondsUntilNextToken }
const TOKEN_BUCKET_SCRIPT = `
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local time = redis.call('TIME')
local now = tonumber(time[1]) + tonumber(time[2]) / 1000000

local bucket = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(bucket[1])
local ts = tonumber(bucket[2])

if tokens == nil then
  tokens = capacity
  ts = now
end

local elapsed = math.max(0, now - ts)
tokens = math.min(capacity, tokens + elapsed * refill_rate)

local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tostring(tokens), 'ts', tostring(now))
redis.call('EXPIRE', key, ttl)

local retry_after = 0
if tokens < 1 then
  retry_after = (1 - tokens) / refill_rate
end

return { allowed, tostring(tokens), tostring(retry_after) }
`

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

// Fire-and-forget usage log — never awaited on the request's critical path
// and never allowed to affect whether the real request succeeds. A dropped
// log entry is a minor annoyance (a gap in the usage history); blocking or
// failing a real AI request because Mongo hiccuped would not be.
function logUsageEvent(fields) {
  RateLimitEvent.create(fields).catch((err) => {
    console.error('[rateLimiter] Failed to log usage event (non-fatal):', err)
  })
}

// A route-scoped rate limiter, keyed per logged-in user (must run after
// `requireAuth`, which is guaranteed on every /api/analyze route). `cost`
// lets more expensive endpoints (a full resume rewrite vs. a plain score)
// consume more of the same hourly bucket per call. `route` is just a label
// for the usage log (see logUsageEvent above) — it plays no part in the
// actual limiting.
export function rateLimit({ cost = 1, route = 'unknown' } = {}) {
  return async function rateLimitMiddleware(req, res, next) {
    const redis = getRedisClient()
    if (!redis) {
      // Not configured — see redis.js for why this fails open rather than
      // blocking every AI call until Upstash is set up.
      return next()
    }
    if (!req.user?._id) {
      return next()
    }

    const plan = req.user.plan && TIERS[req.user.plan] ? req.user.plan : DEFAULT_TIER
    const tier = TIERS[plan]
    const refillPerSecond = tier.refillPerHour / 3600
    // Long enough for the bucket to fully refill from empty, plus a little
    // slack — a user who's been inactive longer than that just starts fresh
    // next time anyway, so there's no reason to keep the key around.
    const ttlSeconds = Math.ceil(tier.capacity / refillPerSecond) + 60
    const key = `ratelimit:analyze:${req.user._id}`

    try {
      const [allowedRaw, remainingRaw, retryAfterRaw] = await redis.eval(
        TOKEN_BUCKET_SCRIPT,
        [key],
        [String(tier.capacity), String(refillPerSecond), String(cost), String(ttlSeconds)],
      )

      const allowed = Number(allowedRaw) === 1
      const remaining = Math.max(0, Math.floor(Number(remainingRaw)))
      const retryAfter = Math.max(0, Number(retryAfterRaw))

      res.setHeader('X-RateLimit-Limit', String(tier.capacity))
      res.setHeader('X-RateLimit-Remaining', String(remaining))
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(Date.now() / 1000 + retryAfter)))
      res.setHeader('X-RateLimit-Tier', plan)

      logUsageEvent({ userId: req.user._id, route, allowed, tier: plan, cost, remaining })

      if (!allowed) {
        res.setHeader('Retry-After', String(Math.ceil(retryAfter)))
        throw ApiError.tooManyRequests(
          `You've used all ${tier.capacity} AI requests on the ${plan} plan for this hour. Try again in about ${formatDuration(retryAfter)}.`,
        )
      }

      next()
    } catch (err) {
      if (err instanceof ApiError) {
        next(err)
        return
      }
      // A Redis/network hiccup shouldn't take down AI features entirely —
      // log it and let the request through unlimited for this one call
      // rather than fail closed on an infra blip.
      console.error('[rateLimiter] Redis call failed, allowing request through:', err)
      next()
    }
  }
}
