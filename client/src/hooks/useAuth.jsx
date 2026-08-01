import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import * as authApi from '../api/authApi'
import { setAuthToken, setUnauthorizedHandler } from '../api/resumeApi'

const AuthContext = createContext(null)
const TOKEN_KEY = 'resulens_token'

function readableOauthError(code) {
  switch (code) {
    case 'google':
      return 'Google sign-in failed. Please try again.'
    case 'github':
      return 'GitHub sign-in failed. Please try again.'
    case 'github_no_email':
      return "We couldn't get a verified email from your GitHub account — make sure you have one set, then try again."
    case 'suspended':
      return 'This account has been suspended. Contact support if you think this is a mistake.'
    default:
      return 'Sign-in failed. Please try again.'
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  // Starts true so the app doesn't flash the login screen before we've had a
  // chance to check whether a stored token is still valid.
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  // Persist token to localStorage whenever it changes. This USED to also call
  // setAuthToken(token) here — that was the actual OAuth bug. React
  // StrictMode double-invokes every effect on its first mount (mount →
  // synthetic cleanup → mount again), including this one. Its first
  // invocation ran with the *stale* `token` value from the render that
  // scheduled it (null, since setToken(candidateToken) hadn't been called
  // yet at that point) — and that second, stale invocation fired *after*
  // init()'s direct setAuthToken(candidateToken) call below, silently
  // overwriting the correct value back to null right before the freshly-
  // mounted dashboard fired its first request. That request went out with
  // no Authorization header, got a 401, and the auto-logout handler below
  // wiped the entire session that had just succeeded.
  // Every real token transition (signup/login/logout/init, all below) already
  // calls setAuthToken() directly and synchronously at the correct time — this
  // effect duplicating that call added no value and, under StrictMode, was
  // actively harmful. Keeping it scoped to ONLY localStorage persistence
  // removes the second writer entirely, so there's nothing left to race.
  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  }, [token])

  // Log out automatically if any resume API call comes back 401 (expired token,
  // or the user was deleted server-side) instead of leaving a broken screen up.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null)
      setToken(null)
      setUser(null)
    })
  }, [])

  // Runs once on mount. Two ways a valid session can show up here:
  // 1. A `?token=...` in the URL — we just landed back from a Google/GitHub
  //    OAuth redirect (see oauth.controller.js on the server).
  // 2. A token already sitting in localStorage from a previous visit.
  // Either way, verify it against /api/auth/me before trusting it. Deliberately
  // not re-run on every token change — login()/signup() already have the fresh
  // user from their own response and don't need this round trip again.
  //
  // This was the actual OAuth bug: React StrictMode (main.jsx) intentionally
  // double-invokes effects in dev — mount, cleanup, mount again — to surface
  // exactly this class of problem. The old `cancelled` flag was designed to
  // protect against a *real* unmount, but here it was also tripped by
  // StrictMode's synthetic cleanup: the first (real) invocation started
  // reading `?token=...`, stripped it from the URL, and kicked off
  // `getMe()` — then StrictMode's cleanup flipped `cancelled = true` before
  // that fetch resolved, so its own `if (!cancelled)` check threw the
  // successful login away. The second invocation then found nothing (the
  // URL had already been stripped by the first one), so it silently landed
  // on `loading: false, user: null` no matter what — every single time,
  // deterministically, which is exactly what you were seeing even though
  // the server logs proved the token exchange worked perfectly. This only
  // happens in dev — StrictMode's double-invoke doesn't run in production
  // builds — which is also why it went unnoticed until now.
  //
  // Fixed with a ref (survives StrictMode's remount, unlike a plain
  // closure variable) so the URL-read + verify body only ever truly runs
  // once per mount. No unmount-cancellation guard needed in exchange —
  // AuthProvider wraps the whole app and never unmounts during normal use.
  const hasInitRef = useRef(false)

  useEffect(() => {
    if (hasInitRef.current) return
    hasInitRef.current = true

    async function init() {
      const params = new URLSearchParams(window.location.search)
      const urlToken = params.get('token')
      const oauthErrorCode = params.get('oauthError')

      if (urlToken || oauthErrorCode) {
        // Strip token/error out of the address bar so it isn't left visible
        // or re-sent if the page is refreshed.
        params.delete('token')
        params.delete('oauthError')
        const rest = params.toString()
        window.history.replaceState({}, '', `${window.location.pathname}${rest ? `?${rest}` : ''}`)
      }

      if (oauthErrorCode) {
        setAuthError(readableOauthError(oauthErrorCode))
      }

      const candidateToken = urlToken || localStorage.getItem(TOKEN_KEY)
      if (!candidateToken) {
        setLoading(false)
        return
      }

      // Set this immediately (not just via the [token]-dependent effect,
      // which now only handles localStorage — see its comment) so that if
      // the dashboard mounts right after, its first request already has the
      // token attached instead of racing the effect.
      setAuthToken(candidateToken)

      try {
        const me = await authApi.getMe(candidateToken)
        setUser(me)
        setToken(candidateToken)
      } catch (err) {
        // This used to fail silently (no authError set) — if getMe() itself
        // is broken (bad JWT_SECRET, CORS, network, server down), the OAuth
        // redirect would land the user right back on the plain landing page
        // with zero indication anything went wrong, same symptom as the
        // already-fixed oauthError-swallowing bug but for a different cause.
        console.error('[auth:init] /api/auth/me failed:', err)
        setAuthError(`Signed in, but couldn't verify the session (${err.message || 'unknown error'}). Please try again.`)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [])

  // These set resumeApi's module-level token synchronously, in the same tick as
  // the state update — not via the [token] effect above. That effect fires in
  // child-before-parent order, so if we relied on it alone, a component that
  // mounts in the same render pass as a successful login/signup (like the
  // dashboard, which fetches immediately) could send its first request before
  // the token was ever attached, get a 401, and trigger an instant auto-logout.
  const signup = useCallback(async ({ name, email, password }) => {
    const result = await authApi.signup({ name, email, password })
    setAuthToken(result.token)
    setUser(result.user)
    setToken(result.token)
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const result = await authApi.login({ email, password })
    setAuthToken(result.token)
    setUser(result.user)
    setToken(result.token)
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
    setToken(null)
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])

  return (
    <AuthContext.Provider value={{ user, loading, authError, clearAuthError, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
