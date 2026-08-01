import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import { signToken } from '../utils/jwt.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SALT_ROUNDS = 10

function toPublicUser(user) {
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

export const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body

  if (!email || !EMAIL_RE.test(email)) {
    throw ApiError.badRequest('A valid email is required')
  }
  if (!password || password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters')
  }

  const existing = await User.findOne({ email: email.toLowerCase() })
  if (existing) {
    throw ApiError.badRequest('An account with that email already exists')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({ name, email, passwordHash })

  const token = signToken(user._id)
  new ApiResponse(201, { user: toPublicUser(user), token }, 'Account created').send(res)
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required')
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password')
  }
  if (!user.passwordHash) {
    throw ApiError.badRequest('This account uses Google or GitHub sign-in — use that button instead')
  }

  const matches = await user.comparePassword(password)
  if (!matches) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  const token = signToken(user._id)
  new ApiResponse(200, { user: toPublicUser(user), token }, 'Logged in').send(res)
})

export const getMe = asyncHandler(async (req, res) => {
  // req.user is attached by the requireAuth middleware.
  new ApiResponse(200, toPublicUser(req.user), 'Current user').send(res)
})
