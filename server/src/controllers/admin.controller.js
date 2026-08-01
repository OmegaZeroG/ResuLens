import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import isValidObjectId from '../utils/isValidObjectId.js'

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
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
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

// The actual feature this panel exists for: manually move someone onto (or
// off) the premium plan — comping someone, undoing a mistake, whatever —
// without needing direct database access every time.
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

  new ApiResponse(200, toAdminUser(user), 'Plan updated').send(res)
})
