// Small pill showing how much of the hourly AI quota is left, driven by the
// X-RateLimit-* headers captured off the last analyze/improve response (see
// rateLimitStore.js). Renders nothing until the first call happens this
// session, and nothing at all if the server isn't enforcing limits (no
// Upstash configured yet — see server/src/config/redis.js) since no headers
// ever arrive in that case.
export function QuotaBadge({ info }) {
  if (!info) return null

  const { limit, remaining, resetAt, tier } = info
  const tone = remaining === 0 ? 'bad' : remaining <= Math.ceil(limit * 0.3) ? 'warn' : 'good'
  const toneClass =
    tone === 'bad'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'

  // Only worth surfacing the reset time once you're actually out — while
  // there's quota left, "resets in 0 minutes" (retryAfter is 0 whenever a
  // token is already available) would just be confusing.
  const resetLabel = remaining === 0 ? formatResetLabel(resetAt) : ''

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${toneClass}`}
      title={resetLabel ? `Next request available ${resetLabel}` : undefined}
    >
      {remaining}/{limit} AI requests left this hour
      <span className="text-[10px] font-normal uppercase tracking-wide opacity-70">{tier}</span>
    </span>
  )
}

function formatResetLabel(resetAt) {
  if (!resetAt) return ''
  const diffMs = resetAt - Date.now()
  if (diffMs <= 0) return 'now'
  const minutes = Math.ceil(diffMs / 60000)
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(minutes / 60)
  return `in ${hours} hour${hours === 1 ? '' : 's'}`
}
