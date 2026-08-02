import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStagedLoading } from './StagedLoader'

// Locks in the actual timing rule from the psychology notes this hook was
// built to encode (see StagedLoader.jsx's own comment): nothing under
// 400ms, plain spinner until 4s, reassuring text until 10s, softer
// "taking a while" language after that.
describe('useStagedLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stays idle when never activated', () => {
    const { result } = renderHook(() => useStagedLoading(false))
    expect(result.current).toBe('idle')
  })

  it('shows nothing for a load that finishes before 400ms — avoids a flash', () => {
    const { result, rerender } = renderHook(({ active }) => useStagedLoading(active), {
      initialProps: { active: true },
    })
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(result.current).toBe('idle')

    rerender({ active: false })
    expect(result.current).toBe('idle')
  })

  it('progresses idle -> spinner -> waiting -> long on schedule', () => {
    const { result } = renderHook(() => useStagedLoading(true))
    expect(result.current).toBe('idle')

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe('spinner')

    act(() => {
      vi.advanceTimersByTime(3600) // total elapsed: 4000ms
    })
    expect(result.current).toBe('waiting')

    act(() => {
      vi.advanceTimersByTime(6000) // total elapsed: 10000ms
    })
    expect(result.current).toBe('long')
  })

  it('resets to idle and restarts the schedule if active flips off then on again', () => {
    const { result, rerender } = renderHook(({ active }) => useStagedLoading(active), {
      initialProps: { active: true },
    })
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(result.current).toBe('waiting')

    rerender({ active: false })
    expect(result.current).toBe('idle')

    rerender({ active: true })
    expect(result.current).toBe('idle') // fresh cycle, not still "waiting"

    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(result.current).toBe('spinner')
  })
})
