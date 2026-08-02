// Bare spinner icon — no wrapping logic. Used directly for small contained
// actions (a button mid-request), and as a building block inside
// StagedLoader for anything that needs the "sense of time passing" states.
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { xs: 'h-3.5 w-3.5', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' }
  return (
    <svg
      className={`animate-spin ${sizes[size] || sizes.md} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
