import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { googleAuthUrl, githubAuthUrl } from '../../api/authApi'
import { Logo } from '../common/Logo'
import { Spinner } from '../common/Spinner'
import { FieldError } from '../common/ErrorState'

// Mirrors the server's actual rules (see auth.controller.js) — a basic
// email shape check and an 8-character minimum. Deliberately not inventing
// stricter-looking rules (uppercase/symbol requirements) the backend
// doesn't actually enforce; a checklist that lies about what's required is
// worse than no checklist.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function RequirementRow({ met, children }) {
  return (
    <li className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border text-[9px] leading-none ${
          met ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'
        }`}
      >
        {met ? '✓' : ''}
      </span>
      {children}
    </li>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.54-5.17 3.54-8.66z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.01c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.93H1.3v3.1C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.31 14.31c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.65H1.3A11.97 11.97 0 0 0 0 12.03c0 1.94.46 3.77 1.3 5.38l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.3 6.65l4.01 3.1c.94-2.83 3.58-4.98 6.69-4.98z"
      />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="#181717">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.7-1.28-1.7-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.12 3.06.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5z" />
    </svg>
  )
}

export function AuthPage({ initialMode = 'login', onBack }) {
  const { login, signup, authError, clearAuthError } = useAuth()
  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const markTouched = (field) => () => setTouched((t) => ({ ...t, [field]: true }))

  const emailValid = EMAIL_RE.test(form.email)
  const passwordLongEnough = form.password.length >= 8
  const passwordsMatch = form.confirmPassword.length > 0 && form.password === form.confirmPassword

  // Signup can't be submitted until every real server-enforced rule is
  // already satisfied client-side — no point letting someone hit "Sign up"
  // just to bounce off a 400 for something the form already knew was wrong.
  // Login stays permissive (just non-empty) since a wrong password is only
  // discoverable server-side anyway.
  const canSubmit =
    mode === 'login'
      ? form.email.length > 0 && form.password.length > 0
      : emailValid && passwordLongEnough && passwordsMatch && form.name.trim().length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    clearAuthError()
    setTouched({ name: true, email: true, password: true, confirmPassword: true })

    if (!canSubmit) return

    setSubmitting(true)
    try {
      if (mode === 'signup') {
        await signup(form)
      } else {
        await login({ email: form.email, password: form.password })
      }
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function toggleMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'))
    setError('')
    setTouched({})
    clearAuthError()
  }

  const displayError = error || authError

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-sm">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-4 text-sm text-slate-400 hover:text-slate-600"
          >
            ← Back to home
          </button>
        )}
        <Logo size="sm" />
        <p className="mt-3 text-sm text-slate-500">
          {mode === 'login' ? 'Log in to your account' : 'Create an account to get started'}
        </p>

        <div className="mt-6 space-y-2">
          <a
            href={googleAuthUrl}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GoogleIcon />
            Continue with Google
          </a>
          <a
            href={githubAuthUrl}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <GithubIcon />
            Continue with GitHub
          </a>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium text-slate-700">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                id="auth-name"
                type="text"
                value={form.name}
                onChange={update('name')}
                onBlur={markTouched('name')}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <FieldError>{touched.name && form.name.trim().length === 0 ? 'Name is required.' : null}</FieldError>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-700">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={form.email}
              onChange={update('email')}
              onBlur={markTouched('email')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            <FieldError>{touched.email && form.email.length > 0 && !emailValid ? 'Enter a valid email address.' : null}</FieldError>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium text-slate-700">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update('password')}
              onBlur={markTouched('password')}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
            {mode === 'signup' ? (
              <ul className="mt-1.5 space-y-0.5">
                <RequirementRow met={passwordLongEnough}>At least 8 characters</RequirementRow>
              </ul>
            ) : (
              <FieldError>
                {touched.password && form.password.length === 0 ? 'Password is required.' : null}
              </FieldError>
            )}
          </div>

          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-confirm-password" className="block text-sm font-medium text-slate-700">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                onBlur={markTouched('confirmPassword')}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <FieldError>
                {touched.confirmPassword && form.confirmPassword.length > 0 && !passwordsMatch
                  ? 'Passwords do not match.'
                  : null}
              </FieldError>
            </div>
          )}

          {displayError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Spinner size="xs" />}
            {submitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
          </button>
        </form>

        <button
          type="button"
          onClick={toggleMode}
          className="mt-4 w-full text-center text-sm text-slate-500 hover:text-slate-700"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}
