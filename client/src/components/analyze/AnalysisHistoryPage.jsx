import { useEffect, useState } from 'react'
import { listAnalyses } from '../../api/analyzeApi'
import { ScoreRing, KeywordChips } from './AnalysisVisuals'

// Analyses are stored newest-first, capped at 50 server-side (see
// `listAnalyses` in analyze.controller.js) — no pagination UI needed yet
// since that ceiling comfortably covers real usage.
export function AnalysisHistoryPage({ onBack, onOpenResume }) {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  useEffect(() => {
    listAnalyses()
      .then((data) => setAnalyses(data || []))
      .catch((err) => setError(err.message || 'Could not load analysis history'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← My Resumes
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Analysis history</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && analyses.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            No analyses yet. Run one from "Analyze against a job" and it'll show up here.
          </div>
        )}

        {!loading && !error && analyses.length > 0 && (
          <div className="space-y-4">
            {analyses.map((a) => {
              const expanded = expandedId === a._id
              return (
                <div key={a._id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : a._id)}
                    className="flex w-full items-center gap-4 text-left"
                  >
                    <div className="relative h-14 w-14 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-14 w-14 -rotate-90">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          fill="none"
                          stroke={a.score >= 75 ? '#16a34a' : a.score >= 50 ? '#d97706' : '#dc2626'}
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 42}
                          strokeDashoffset={2 * Math.PI * 42 - (a.score / 100) * (2 * Math.PI * 42)}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
                        {a.score}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800">
                        {a.resumeSource === 'saved' ? 'Saved resume' : 'Uploaded resume'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-400">
                        {a.jdText?.slice(0, 120)}
                        {a.jdText?.length > 120 ? '…' : ''}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-indigo-600">
                      {expanded ? 'Hide details' : 'View details'}
                    </span>
                  </button>

                  {expanded && (
                    <div className="mt-5 space-y-5 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-5">
                        <ScoreRing score={a.score} />
                        <p className="text-sm text-slate-500">
                          Match score at the time this analysis ran. Re-run "Analyze against a
                          job" to get a fresh score if the resume has changed since.
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">Matched keywords</h3>
                        <KeywordChips items={a.matchedKeywords} tone="good" />
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">Missing keywords</h3>
                        <KeywordChips items={a.missingKeywords} tone="bad" />
                      </div>

                      <div>
                        <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggestions</h3>
                        {a.suggestions?.length ? (
                          <ul className="space-y-2 text-sm text-slate-600">
                            {a.suggestions.map((s, i) => (
                              <li key={i} className="flex gap-2">
                                <span className="text-indigo-500">•</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400">None</p>
                        )}
                      </div>

                      {a.resumeSource === 'saved' && a.resumeId && (
                        <button
                          type="button"
                          onClick={() => onOpenResume?.(a.resumeId)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Open this resume in builder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
