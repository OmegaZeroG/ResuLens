import { useEffect, useRef, useState } from 'react'
import { Spinner } from './Spinner'

// Loading-state psychology, encoded instead of left to guesswork per call
// site:
//   < ~400ms   nothing at all — anything faster than that and a spinner is
//              just a flash, showing one makes the wait *feel* slower, not
//              shorter.
//   400ms-4s   a plain spinner, no text — this is the normal "brief wait"
//              zone, doesn't need explaining.
//   4s-10s     spinner + a reassuring line ("Still working…") — long enough
//              that silence starts to read as "is this stuck?"
//   10s+       different, softer message ("This is taking longer than
//              usual…") — a bare spinner past ~10s with no acknowledgment is
//              where patience actually flips into frustration. We can't
//              promise a real progress bar for an AI call (no byte count to
//              track), so the fix here is honest language, not a fake bar.
// One hook, reused everywhere something async takes an unpredictable amount
// of time (Gemini calls, cold-start API requests) instead of every page
// inventing its own timers.
export function useStagedLoading(active) {
  const [stage, setStage] = useState('idle') // idle | spinner | waiting | long
  const timers = useRef([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (!active) {
      setStage('idle')
      return undefined
    }
    setStage('idle')
    timers.current.push(setTimeout(() => setStage('spinner'), 400))
    timers.current.push(setTimeout(() => setStage('waiting'), 4000))
    timers.current.push(setTimeout(() => setStage('long'), 10000))
    return () => timers.current.forEach(clearTimeout)
  }, [active])

  return stage
}

// Drop-in replacement for the old `{submitting && <p>Analyzing…</p>}` text
// swaps — same idea, but staged per the timing rule above instead of
// showing the same static line for the whole wait regardless of how long
// it's actually taking.
export function StagedLoader({
  active,
  idleText = null,
  waitingText = 'Still working…',
  longText = 'This is taking longer than usual — hang tight.',
  className = '',
}) {
  const stage = useStagedLoading(active)
  if (stage === 'idle') return idleText ? <span className={className}>{idleText}</span> : null

  return (
    <div className={`flex items-center gap-2 text-sm text-slate-500 ${className}`}>
      <Spinner size="sm" />
      {stage === 'waiting' && <span>{waitingText}</span>}
      {stage === 'long' && <span>{longText}</span>}
    </div>
  )
}
