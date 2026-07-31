import crypto from 'node:crypto'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { signToken } from '../utils/jwt.js'
import { oauthConfig } from '../config/oauth.js'

const STATE_COOKIE = 'oauth_state'
const STATE_COOKIE_MAX_AGE_MS = 5 * 60 * 1000 // 5 minutes — just long enough to complete the redirect round trip

// Finds an existing user by provider id, falls back to linking by email (so
// someone who signed up with a password can also log in with Google/GitHub
// later using the same email), and creates a new account otherwise.
async function findOrCreateOAuthUser({ providerField, providerId, email, name, avatarUrl }) {
  let user = await User.findOne({ [providerField]: providerId })
  if (user) return user

  const normalizedEmail = email.toLowerCase()
  user = await User.findOne({ email: normalizedEmail })
  if (user) {
    user[providerField] = providerId
    if (!user.avatarUrl && avatarUrl) user.avatarUrl = avatarUrl
    await user.save()
    return user
  }

  return User.create({
    name,
    email: normalizedEmail,
    [providerField]: providerId,
    avatarUrl,
  })
}

function setStateCookie(res, state) {
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: STATE_COOKIE_MAX_AGE_MS,
    sameSite: 'lax', // sent on the top-level GET navigation back from Google/GitHub
    secure: process.env.NODE_ENV === 'production',
  })
}

// Sends the browser back to the client with either a token or an error code
// in the query string. The client reads and immediately strips this on load.
function redirectToClient(res, params) {
  const query = new URLSearchParams(params).toString()
  res.redirect(`${oauthConfig.clientUrl}/?${query}`)
}

export const googleRedirect = asyncHandler(async (req, res) => {
  if (!oauthConfig.google.clientId) {
    throw ApiError.internal('Google sign-in is not configured on the server yet')
  }
  const state = crypto.randomBytes(16).toString('hex')
  setStateCookie(res, state)
  const params = new URLSearchParams({
    client_id: oauthConfig.google.clientId,
    redirect_uri: oauthConfig.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  })
  console.log('[oauth:google] redirecting to Google, redirect_uri =', oauthConfig.google.redirectUri)
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
})

export const googleCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query
  const savedState = req.cookies?.[STATE_COOKIE]
  res.clearCookie(STATE_COOKIE)

  console.log('[oauth:google] callback hit — code present:', Boolean(code), '| state present:', Boolean(state), '| cookie present:', Boolean(savedState), '| match:', state === savedState)

  if (!code || !state || state !== savedState) {
    console.warn('[oauth:google] rejecting — code/state/cookie check failed (see booleans above). This is almost always the cookie not round-tripping: check that GOOGLE_REDIRECT_URI in .env is http://localhost:5000/... (not 127.0.0.1 — that\'s a different host as far as cookies are concerned) and that nothing is stripping cookies between the two hops.')
    return redirectToClient(res, { oauthError: 'google' })
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: oauthConfig.google.clientId,
      client_secret: oauthConfig.google.clientSecret,
      redirect_uri: oauthConfig.google.redirectUri,
      grant_type: 'authorization_code',
    }),
  })
  const tokenBody = await tokenRes.json()
  if (!tokenRes.ok || !tokenBody.access_token) {
    console.error('[oauth:google] token exchange failed:', tokenBody)
    return redirectToClient(res, { oauthError: 'google' })
  }
  console.log('[oauth:google] token exchange OK')

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
  })
  const profile = await profileRes.json()
  if (!profileRes.ok || !profile.email) {
    console.error('[oauth:google] profile fetch failed:', profile)
    return redirectToClient(res, { oauthError: 'google' })
  }
  console.log('[oauth:google] profile OK for', profile.email)

  let user
  try {
    user = await findOrCreateOAuthUser({
      providerField: 'googleId',
      providerId: profile.sub,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    })
  } catch (err) {
    console.error('[oauth:google] findOrCreateOAuthUser threw:', err)
    return redirectToClient(res, { oauthError: 'google' })
  }

  const jwtToken = signToken(user._id)
  console.log('[oauth:google] success, redirecting to client with token for user', user._id.toString())
  redirectToClient(res, { token: jwtToken })
})

export const githubRedirect = asyncHandler(async (req, res) => {
  if (!oauthConfig.github.clientId) {
    throw ApiError.internal('GitHub sign-in is not configured on the server yet')
  }
  const state = crypto.randomBytes(16).toString('hex')
  setStateCookie(res, state)
  const params = new URLSearchParams({
    client_id: oauthConfig.github.clientId,
    redirect_uri: oauthConfig.github.redirectUri,
    scope: 'read:user user:email',
    state,
  })
  console.log('[oauth:github] redirecting to GitHub, redirect_uri =', oauthConfig.github.redirectUri)
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
})

export const githubCallback = asyncHandler(async (req, res) => {
  const { code, state } = req.query
  const savedState = req.cookies?.[STATE_COOKIE]
  res.clearCookie(STATE_COOKIE)

  console.log('[oauth:github] callback hit — code present:', Boolean(code), '| state present:', Boolean(state), '| cookie present:', Boolean(savedState), '| match:', state === savedState)

  if (!code || !state || state !== savedState) {
    console.warn('[oauth:github] rejecting — code/state/cookie check failed (see booleans above).')
    return redirectToClient(res, { oauthError: 'github' })
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      code,
      client_id: oauthConfig.github.clientId,
      client_secret: oauthConfig.github.clientSecret,
      redirect_uri: oauthConfig.github.redirectUri,
    }),
  })
  const tokenBody = await tokenRes.json()
  if (!tokenRes.ok || !tokenBody.access_token) {
    console.error('[oauth:github] token exchange failed:', tokenBody)
    return redirectToClient(res, { oauthError: 'github' })
  }
  console.log('[oauth:github] token exchange OK')

  const profileRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/vnd.github+json' },
  })
  const profile = await profileRes.json()
  if (!profileRes.ok || !profile.id) {
    console.error('[oauth:github] profile fetch failed:', profile)
    return redirectToClient(res, { oauthError: 'github' })
  }
  console.log('[oauth:github] profile OK for', profile.login)

  // GitHub only includes a public email in /user if the user opted in; fall
  // back to /user/emails (still needs the user:email scope we requested).
  let email = profile.email
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenBody.access_token}`, Accept: 'application/vnd.github+json' },
    })
    const emails = await emailsRes.json()
    const primary = Array.isArray(emails)
      ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
      : null
    email = primary?.email
  }

  if (!email) {
    console.warn('[oauth:github] no verified email found on the account')
    return redirectToClient(res, { oauthError: 'github_no_email' })
  }

  let user
  try {
    user = await findOrCreateOAuthUser({
      providerField: 'githubId',
      providerId: String(profile.id),
      email,
      name: profile.name || profile.login,
      avatarUrl: profile.avatar_url,
    })
  } catch (err) {
    console.error('[oauth:github] findOrCreateOAuthUser threw:', err)
    return redirectToClient(res, { oauthError: 'github' })
  }

  const jwtToken = signToken(user._id)
  console.log('[oauth:github] success, redirecting to client with token for user', user._id.toString())
  redirectToClient(res, { token: jwtToken })
})
