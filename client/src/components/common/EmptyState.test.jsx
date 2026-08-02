import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState title="No resumes yet" description="Build one to get started." />)
    expect(screen.getByText('No resumes yet')).toBeInTheDocument()
    expect(screen.getByText('Build one to get started.')).toBeInTheDocument()
  })

  it('omits the CTA button when no handler is given', () => {
    render(<EmptyState title="No resumes yet" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onAction when the CTA is clicked', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(<EmptyState title="No resumes yet" actionLabel="+ New Resume" onAction={onAction} />)

    await user.click(screen.getByRole('button', { name: '+ New Resume' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
