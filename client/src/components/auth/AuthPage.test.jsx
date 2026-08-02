import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthPage } from './AuthPage'
import { useAuth } from '../../hooks/useAuth'

// AuthPage reads everything through useAuth() — mocking the whole module
// lets these tests drive login/signup outcomes directly instead of needing
// a real AuthProvider + backend.
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

function mockAuth(overrides = {}) {
  useAuth.mockReturnValue({
    login: vi.fn(),
    signup: vi.fn(),
    authError: '',
    clearAuthError: vi.fn(),
    ...overrides,
  })
}

describe('AuthPage — signup validation', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('keeps the submit button disabled until every server-enforced rule is met', async () => {
    const user = userEvent.setup()
    render(<AuthPage initialMode="signup" />)

    const submit = screen.getByRole('button', { name: 'Sign up' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/Name/), 'Om')
    await user.type(screen.getByLabelText(/^Email/), 'not-an-email')
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/^Password/), 'short')
    expect(submit).toBeDisabled() // under 8 characters

    await user.clear(screen.getByLabelText(/^Password/))
    await user.type(screen.getByLabelText(/^Password/), 'longenough1')
    await user.type(screen.getByLabelText(/Confirm password/), 'longenough1')
    expect(submit).toBeDisabled() // email is still invalid

    await user.clear(screen.getByLabelText(/^Email/))
    await user.type(screen.getByLabelText(/^Email/), 'om@example.com')
    expect(submit).toBeEnabled()
  })

  it('shows an inline mismatch error only after the confirm-password field is touched', async () => {
    const user = userEvent.setup()
    render(<AuthPage initialMode="signup" />)

    await user.type(screen.getByLabelText(/^Password/), 'longenough1')
    // Not touched yet — typing in a different field shouldn't surface it early.
    expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Confirm password/), 'different1')
    await user.tab() // blur confirm-password
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()
  })

  it('calls signup with the form values on a valid submit', async () => {
    const signup = vi.fn().mockResolvedValue(undefined)
    mockAuth({ signup })
    const user = userEvent.setup()
    render(<AuthPage initialMode="signup" />)

    await user.type(screen.getByLabelText(/Name/), 'Om')
    await user.type(screen.getByLabelText(/^Email/), 'om@example.com')
    await user.type(screen.getByLabelText(/^Password/), 'longenough1')
    await user.type(screen.getByLabelText(/Confirm password/), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Sign up' }))

    expect(signup).toHaveBeenCalledWith({
      name: 'Om',
      email: 'om@example.com',
      password: 'longenough1',
      confirmPassword: 'longenough1',
    })
  })
})

describe('AuthPage — login', () => {
  it('login only requires non-empty fields — the real check is server-side', async () => {
    mockAuth()
    const user = userEvent.setup()
    render(<AuthPage initialMode="login" />)

    const submit = screen.getByRole('button', { name: 'Log in' })
    expect(submit).toBeDisabled()

    await user.type(screen.getByLabelText(/Email/), 'a@b.com')
    await user.type(screen.getByLabelText(/Password/), 'x')
    expect(submit).toBeEnabled()
  })

  it('surfaces the server error message when login rejects', async () => {
    const login = vi.fn().mockRejectedValue(new Error('Invalid email or password'))
    mockAuth({ login })
    const user = userEvent.setup()
    render(<AuthPage initialMode="login" />)

    await user.type(screen.getByLabelText(/Email/), 'a@b.com')
    await user.type(screen.getByLabelText(/Password/), 'wrongpass')
    await user.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
  })
})
