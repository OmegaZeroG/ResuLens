// Inline error banner — replaces the app's old ad-hoc
// `<p className="text-red-500">{error}</p>` pattern with something that
// does the three things a good error should: says what happened (title),
// says why in plain terms (message — never a raw backend/DB error string),
// and gives a way forward (onRetry). Sits right next to whatever failed,
// not off in a toast, since the user's eyes are already there.
export function ErrorState({ title = 'Something went wrong', message, onRetry, retryLabel = 'Try again', className = '' }) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 ${className}`} role="alert">
      <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.2h.01" strokeLinecap="round" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{title}</p>
        {message && <p className="mt-0.5 text-sm text-red-600">{message}</p>}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-medium text-red-700 underline decoration-red-300 underline-offset-2 hover:text-red-900"
          >
            {retryLabel}
          </button>
        )}
      </div>
    </div>
  )
}

// Small inline variant for a single form field ("Enter a valid email") —
// no icon, no card, sits directly under the input.
export function FieldError({ children, className = '' }) {
  if (!children) return null
  return (
    <p className={`mt-1 flex items-center gap-1 text-xs text-red-600 ${className}`} role="alert">
      {children}
    </p>
  )
}
