// Blocking error — used when the user genuinely cannot continue until the
// issue is addressed (e.g. no access to a resource), unlike ErrorState
// (inline, page stays usable) or a toast (dismissible, non-critical).
// Always pairs the problem with a real next action, never just an "OK".
export function ErrorModal({ open, title = 'Something went wrong', message, actionLabel, onAction, onClose }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {message && <p className="mt-2 text-sm text-slate-500">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          )}
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
