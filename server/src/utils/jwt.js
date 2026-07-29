import jwt from 'jsonwebtoken'

const EXPIRES_IN = '7d' // long-lived on purpose — this is a portfolio demo, not
// something that needs to survive a real threat model. Revisit if this ever
// handles real user data.

export function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set — add it to server/.env')
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set — add it to server/.env')
  }
  return jwt.verify(token, process.env.JWT_SECRET)
}
