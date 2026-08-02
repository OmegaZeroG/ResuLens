import User from '../models/User.js'
import Resume from '../models/Resume.js'
import Analysis from '../models/Analysis.js'
import RateLimitEvent from '../models/RateLimitEvent.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import isValidObjectId from '../utils/isValidObjectId.js'
import { getRedisClient } from '../config/redis.js'

// Every handler here runs behind requireAuth + requireAdmin (see
// admin.routes.js) — this is the one controller in the app that isn't
// scoped to req.user._id by design, it deliberately reads/writes any user.

const PLAN_VALUES = ['free', 'premium']

function toAdminUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    plan: user.plan,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}

// A target user id that matches the acting admin's own id — used to block
// an admin from suspending/deleting themselves and getting locked out with
// no one left who can undo it.
function isSelf(req) {
  return req.params.id === req.user._id.toString()
}

// Optional ?q= does a simple case-insensitive name/email substring match.
// Client-side filtering would work fine at today's user count too, but doing
// it here means the search still works if the user list ever gets large
// enough that shipping every row to the browser stops making sense.
export const listUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim()
  const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] } : {}
  const users = await User.find(filter).sort({ createdAt: -1 })
  new ApiResponse(200, users.map(toAdminUser), 'Users fetched').send(res)
})

// Platform-wide numbers for the dashboard header: how many accounts exist
// (and on which plan), how much content they've created, and a day-by-day
// signup count for the last 14 days so growth is visible at a glance instead
// of just a single cumulative total.
export const getStats = asyncHandler(async (req, res) => {
  const [totalUsers, premiumUsers, suspendedUsers, totalResumes, totalAnalyses] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ plan: 'premium' }),
    User.countDocuments({ isActive: false }),
    Resume.countDocuments(),
    Analysis.countDocuments(),
  ])

  const DAYS = 14
  const since = new Date()
  since.setUTCHours(0, 0, 0, 0)
  since.setUTCDate(since.getUTCDate() - (DAYS - 1))

  const signupAgg = await User.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
  ])
  const signupMap = new Map(signupAgg.map((row) => [row._id, row.count]))

  // Always return a dense DAYS-length array (zero-filled) rather than just
  // whatever days had activity — a bar chart with gaps is confusing to read,
  // this way the client can just map straight over it.
  const signups = []
  for (let i = 0; i < DAYS; i += 1) {
    const d = new Date(since)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    signups.push({ date: key, count: signupMap.get(key) || 0 })
  }

  new ApiResponse(
    200,
    {
      totalUsers,
      premiumUsers,
      freeUsers: totalUsers - premiumUsers,
      suspendedUsers,
      totalResumes,
      totalAnalyses,
      signups,
    },
    'Stats fetched',
  ).send(res)
})

// Everything needed for the "click a user, see their account" detail panel —
// their resumes, recent AI usage, and rate-limit activity. Deliberately
// read-only and capped (most-recent N of each), this is a support/debugging
// view, not a full data export.
export const getUserDetail = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid user id')
  }
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  const [resumes, resumeCount, recentAnalyses, analysisCount, recentEvents] = await Promise.all([
    Resume.find({ userId: user._id }).select('title updatedAt template').sort({ updatedAt: -1 }).limit(20),
    Resume.countDocuments({ userId: user._id }),
    Analysis.find({ userId: user._id }).select('score resumeSource createdAt').sort({ createdAt: -1 }).limit(10),
    Analysis.countDocuments({ userId: user._id }),
    RateLimitEvent.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10),
  ])

  new ApiResponse(
    200,
    {
      user: toAdminUser(user),
      resumeCount,
      analysisCount,
      resumes,
      recentAnalyses,
      recentEvents,
    },
    'User detail fetched',
  ).send(res)
})

// The actual feature the panel was originally built for: manually move
// someone onto (or off) the premium plan — comping someone, undoing a
// mistake, whatever — without needing direct database access every time.
export const updateUserPlan = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid user id')
  }
  const { plan } = req.body
  if (!PLAN_VALUES.includes(plan)) {
    throw ApiError.badRequest(`plan must be one of: ${PLAN_VALUES.join(', ')}`)
  }

  const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true, runValidators: true })
  if (!user) throw ApiError.notFound('User not found')

  // The rate-limit bucket in Redis is keyed per user, not per plan (see
  // rateLimiter.js's TOKEN_BUCKET_SCRIPT) — it just holds a token count and a
  // timestamp. Changing User.plan here changes the *limit* the bucket is
  // checked against on the next request, but the bucket's current *token
  // count* carries over untouched, and only refills gradually at the new
  // plan's rate rather than jumping straight to the new capacity. Without
  // this, someone upgraded from free (5/hr) to premium (30/hr) mid-hour
  // would see the higher limit immediately but their actual remaining count
  // would stay wherever it was on the free tier — confusing, and not what
  // "upgrade" should feel like. Deleting the key resets them to a full fresh
  // bucket at the new tier right away. Best-effort: if Redis isn't
  // configured or this call fails, the plan change itself still succeeds —
  // matches this app's existing fail-open stance on rate limiting elsewhere.
  try {
    const redis = getRedisClient()
    if (redis) await redis.del(`ratelimit:analyze:${user._id}`)
  } catch (err) {
    console.error('[admin] Failed to reset rate-limit bucket after plan change (non-fatal):', err)
  }

  new ApiResponse(200, toAdminUser(user), 'Plan updated').send(res)
})

// Clears a user's hourly AI-quota bucket early — e.g. they burned it
// testing something and want their real usage back, not a genuine abuse
// case. The token bucket is a single Redis hash keyed per user (see
// rateLimiter.js's TOKEN_BUCKET_SCRIPT) — deleting the key is equivalent to
// "as if they'd never made a request," since a missing key is treated as a
// full bucket on the next check.
export const resetUserRateLimit = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid user id')
  }
  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  const redis = getRedisClient()
  if (!redis) {
    throw ApiError.badRequest('Rate limiting is not configured on this server (no Upstash credentials) — there is no quota to reset')
  }

  await redis.del(`ratelimit:analyze:${user._id}`)
  new ApiResponse(200, { reset: true }, 'Rate limit reset').send(res)
})

// Suspend/reactivate — a reversible switch (see User.isActive, checked in
// requireAuth + login + both OAuth callbacks) rather than deleting anything.
// Blocks acting on your own account so an admin can never lock themselves
// out with no one left able to undo it.
export const setUserActive = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid user id')
  }
  if (isSelf(req)) {
    throw ApiError.badRequest("You can't suspend your own account")
  }
  const { isActive } = req.body
  if (typeof isActive !== 'boolean') {
    throw ApiError.badRequest('isActive must be true or false')
  }

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true, runValidators: true })
  if (!user) throw ApiError.notFound('User not found')

  new ApiResponse(200, toAdminUser(user), isActive ? 'User reactivated' : 'User suspended').send(res)
})

// Permanent, cascading delete — removes the account and everything scoped
// to it (resumes, analyses, rate-limit log entries). Note this mirrors an
// existing gap in resume.controller.js's own deleteResume: neither cleans
// up the corresponding ImageKit photo files, which are left orphaned in the
// ImageKit account. Not introduced here, just not fixed here either — a
// pre-existing scope call, flagged in TASKS.md.
export const deleteUser = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid user id')
  }
  if (isSelf(req)) {
    throw ApiError.badRequest("You can't delete your own account")
  }

  const user = await User.findById(req.params.id)
  if (!user) throw ApiError.notFound('User not found')

  await Promise.all([
    Resume.deleteMany({ userId: user._id }),
    Analysis.deleteMany({ userId: user._id }),
    RateLimitEvent.deleteMany({ userId: user._id }),
  ])
  await User.findByIdAndDelete(user._id)

  new ApiResponse(200, null, 'User deleted').send(res)
})
