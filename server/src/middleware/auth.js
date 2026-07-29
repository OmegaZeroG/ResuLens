import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { verifyToken } from '../utils/jwt.js'

// Verifies the Bearer token, loads the user, and attaches it as req.user.
// Any failure (missing header, bad/expired token, deleted user) becomes a clean
// 401 via the global error handler rather than a raw jsonwebtoken error leaking out.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid Authorization header')
    }

    const token = header.slice('Bearer '.length)
    const decoded = verifyToken(token)

    const user = await User.findById(decoded.id)
    if (!user) {
      throw ApiError.unauthorized('User no longer exists')
    }

    req.user = user
    next()
  } catch (err) {
    if (err instanceof ApiError) {
      next(err)
    } else {
      next(ApiError.unauthorized('Invalid or expired token'))
    }
  }
}
