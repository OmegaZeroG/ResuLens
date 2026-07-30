import { useEffect, useState } from 'react'

// Ticks once a second while `targetMs` is a real future timestamp, returning
// the remaining whole seconds (clamped to 0 once it's passed). Returns null
// when `targetMs` is falsy, so callers can tell "no countdown running" apart
// from "0 seconds left" — used by AnalyzePage to show a live "try again in
// Xm Ys" instead of a static, instantly-stale message.
export function useCountdown(targetMs) {
  const [remaining, setRemaining] = useState(() => computeRemaining(targetMs))

  useEffect(() => {
    if (!targetMs) {
      setRemaining(null)
      return undefined
    }
    setRemaining(computeRemaining(targetMs))
    const interval = setInterval(() => {
      setRemaining(computeRemaining(targetMs))
    }, 1000)
    return () => clearInterval(interval)
  }, [targetMs])

  return remaining
}

function computeRemaining(targetMs) {
  if (!targetMs) return null
  return Math.max(0, Math.round((targetMs - Date.now()) / 1000))
}

export function formatCountdown(seconds) {
  if (seconds === null || seconds === undefined) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
