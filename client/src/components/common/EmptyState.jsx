// Empty state — tells the user why a list/section is empty and what to do
// about it, instead of a bare "No items." A dashed border keeps it visually
// distinct from a real (loaded, populated) card so it doesn't read as an
// error or a loading glitch.
export function EmptyState({ icon, title, description, actionLabel, onAction, className = '' }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border border-dashed border-slate-300 px-6 py-12 text-center ${className}`}>
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
