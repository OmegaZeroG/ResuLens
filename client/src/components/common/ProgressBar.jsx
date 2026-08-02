// Determinate progress bar for anything with a real, measurable duration
// (a file upload with byte progress). `indeterminate` covers the "we know
// this takes a while but can't measure it" case — a sliding bar reads as
// "actively working" more honestly than a bare spinner for longer, bounded
// operations (installs, multi-step imports).
export function ProgressBar({ value = 0, indeterminate = false, className = '' }) {
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 ${className}`}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <div className="h-full w-1/3 rounded-full bg-indigo-500 animate-[progress-indeterminate_1.2s_ease-in-out_infinite]" />
      ) : (
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  )
}
