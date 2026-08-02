import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorState, FieldError } from './ErrorState'

describe('ErrorState', () => {
  it('renders the title and message', () => {
    render(<ErrorState title="Couldn't load your resumes" message="Network error" />)
    expect(screen.getByText("Couldn't load your resumes")).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('has no retry button when onRetry is not given', () => {
    render(<ErrorState title="Failed" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorState title="Failed" onRetry={onRetry} retryLabel="Try again" />)

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

describe('FieldError', () => {
  it('renders nothing when there is no message', () => {
    const { container } = render(<FieldError>{null}</FieldError>)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the message when given one', () => {
    render(<FieldError>Enter a valid email address.</FieldError>)
    expect(screen.getByText('Enter a valid email address.')).toBeInTheDocument()
  })
})
