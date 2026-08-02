import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from './Toast'

function Trigger() {
  const toast = useToast()
  return (
    <>
      <button onClick={() => toast.success('Saved!')}>fire success</button>
      <button onClick={() => toast.error('Broke!', { duration: 0 })}>fire sticky error</button>
    </>
  )
}

describe('Toast', () => {
  it('useToast throws a clear error when used outside a ToastProvider', () => {
    function Bare() {
      useToast()
      return null
    }
    // React logs its own noisy error-boundary warning for an uncaught render
    // error — expected here, silenced so the test output stays readable.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bare />)).toThrow('useToast must be used within a ToastProvider')
    spy.mockRestore()
  })

  it('shows a pushed toast and auto-dismisses it after its duration', () => {
    vi.useFakeTimers()
    // fireEvent instead of user-event here — user-event's click() does an
    // async pointer-event choreography that hangs indefinitely once fake
    // timers are installed (a known interaction between the two libraries),
    // even with delay: null. fireEvent.click is synchronous and sidesteps it
    // entirely; a plain click doesn't need user-event's extra realism.
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('fire success'))
    })
    expect(screen.getByText('Saved!')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(screen.queryByText('Saved!')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('a toast created with duration: 0 stays until manually dismissed', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )

    await user.click(screen.getByText('fire sticky error'))
    expect(screen.getByText('Broke!')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Dismiss'))
    expect(screen.queryByText('Broke!')).not.toBeInTheDocument()
  })
})
