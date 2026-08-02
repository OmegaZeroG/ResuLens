// Skeleton screens — used instead of a spinner/"Loading…" text when a
// whole page or a large chunk of content (a list, a table, a stats grid)
// is loading, so the layout the content will land in is visible from the
// first paint instead of popping in all at once.

export function SkeletonLine({ className = '' }) {
  return <div className={`animate-pulse rounded bg-slate-200 ${className}`} />
}

export function SkeletonCircle({ className = '' }) {
  return <div className={`animate-pulse rounded-full bg-slate-200 ${className}`} />
}

// Mirrors the shape of a resume-dashboard card / admin stat card — a title
// line plus a couple of body lines of varying width so it doesn't look like
// a uniform gray block.
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      <SkeletonLine className="h-4 w-2/5" />
      <SkeletonLine className="mt-3 h-3 w-full" />
      <SkeletonLine className="mt-2 h-3 w-4/5" />
    </div>
  )
}

export function SkeletonCardGrid({ count = 3, className = '' }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Table body rows — pass the real <thead> in from the caller and drop this
// in as the <tbody> content while data is loading, so the header (and its
// column widths) stay stable between loading and loaded states.
export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-t border-slate-100">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3 py-3">
              <SkeletonLine className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
