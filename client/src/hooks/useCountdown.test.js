import { describe, it, expect } from 'vitest'
import { formatCountdown } from './useCountdown'

describe('formatCountdown', () => {
  it('returns an empty string when there is no countdown running', () => {
    expect(formatCountdown(null)).toBe('')
    expect(formatCountdown(undefined)).toBe('')
  })

  it('formats whole minutes and seconds as m:ss, zero-padding seconds', () => {
    expect(formatCountdown(0)).toBe('0:00')
    expect(formatCountdown(5)).toBe('0:05')
    expect(formatCountdown(59)).toBe('0:59')
    expect(formatCountdown(60)).toBe('1:00')
    expect(formatCountdown(125)).toBe('2:05')
  })

  it('does not zero-pad the minutes part', () => {
    expect(formatCountdown(3661)).toBe('61:01')
  })
})
