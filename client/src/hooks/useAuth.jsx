import { createContext, useCallback, useContext, useEffect, useState } from 'react'
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

  // Keep resumeApi's module-level token (and localStorage) in sync with state.
  useEffect(() => {
    setAuthToken(token)
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
  useEffect(() => {
    let cancelled = false

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

      // Set this immediately (not just via the [token] effect above) so that
      // if the dashboard mounts right after, its first request already has
      // the token attached instead of racing the effect.
      setAuthToken(candidateToken)

      try {
        const me = await authApi.getMe(candidateToken)
        if (!cancelled) {
          setUser(me)
          setToken(candidateToken)
        }
      } catch {
        if (!cancelled) setToken(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
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
