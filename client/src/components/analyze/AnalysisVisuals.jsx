// Small visual pieces shared between a live analysis result (AnalyzePage) and
// a past one (AnalysisHistoryPage) — kept in one place so both always render
// a score/keyword result identically instead of drifting apart.

export function ScoreRing({ score }) {
  const color = score >= 75 ? '#16a34a' : score >= 50 ? '#d97706' : '#dc2626'
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-800">{score}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">Match</span>
      </div>
    </div>
  )
}

export function KeywordChips({ items, tone }) {
  if (!items?.length) {
    return <p className="text-sm text-slate-400">None</p>
  }
  const toneClass =
    tone === 'good'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-red-50 text-red-700 border-red-200'
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClass}`}>
          {item}
        </span>
      ))}
    </div>
  )
}
