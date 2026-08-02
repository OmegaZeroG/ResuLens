import { useEffect, useState } from 'react'
import { getUsageStats } from '../../api/analyzeApi'

// Your own AI usage history — not a cross-account admin panel (ResuLens has
// no admin role; every other screen is already scoped to the logged-in user
// the same way). Makes the rate limiter's effect visible instead of
// invisible plumbing: how many requests you've made, how many got blocked,
// and a recent-activity trail.
export function UsagePage({ onBack }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getUsageStats()
      .then(setStats)
      .catch((err) => setError(err.message || 'Could not load usage stats'))
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
          <h1 className="text-lg font-semibold text-slate-800">AI usage</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading && <p className="text-sm text-slate-400">Loading…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {!loading && !error && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Plan"
                value={stats.tier === 'premium' ? 'Premium' : 'Free'}
                sub={`${stats.limits.capacity} AI requests / hour`}
              />
              <SummaryCard label="Last 24h — allowed" value={stats.last24h.allowed} tone="good" />
              <SummaryCard label="Last 24h — blocked" value={stats.last24h.blocked} tone={stats.last24h.blocked > 0 ? 'bad' : 'neutral'} />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-800">Recent activity</h2>
              {stats.recent.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No AI requests yet — run an analysis and it'll show up here.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.recent.map((event) => (
                    <div key={event._id} className="flex items-center justify-between py-2.5 text-sm">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            event.allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {event.allowed ? 'Allowed' : 'Blocked'}
                        </span>
                        <span className="font-medium text-slate-700 capitalize">{event.route}</span>
                        <span className="text-xs text-slate-400">cost {event.cost}</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub, tone = 'neutral' }) {
  const toneClass =
    tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : 'text-slate-800'
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}
