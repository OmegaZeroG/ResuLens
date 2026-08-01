import { useEffect, useState } from 'react'
import { getUserDetail, resetUserRateLimit, setUserActive } from '../../api/adminApi'
import { ConfirmDialog } from '../resume/ConfirmDialog'

// Support/debugging view for one account — read-only except for the three
// admin actions at the bottom (reset quota, suspend/reactivate, delete).
// Delete is handled by the parent (AdminPage) so the same confirm-then-
// remove-from-list flow works whether it's triggered from here or straight
// from the table row.
export function UserDetailModal({ userId, onClose, onUserUpdated, onDeleteRequest }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    getUserDetail(userId)
      .then(setDetail)
      .catch((err) => setError(err.message || 'Could not load user'))
      .finally(() => setLoading(false))
  }, [userId])

  async function handleResetLimit() {
    setBusy(true)
    setError('')
    try {
      await resetUserRateLimit(userId)
      setDetail((prev) => (prev ? { ...prev, recentEvents: [] } : prev))
    } catch (err) {
      setError(err.message || 'Failed to reset rate limit')
    } finally {
      setBusy(false)
    }
  }

  async function handleToggleActive() {
    if (detail.user.isActive) {
      setShowSuspendConfirm(true)
      return
    }
    await reactivate()
  }

  async function reactivate() {
    setBusy(true)
    setError('')
    try {
      const updated = await setUserActive(userId, true)
      setDetail((prev) => (prev ? { ...prev, user: updated } : prev))
      onUserUpdated?.(updated)
    } catch (err) {
      setError(err.message || 'Failed to reactivate user')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmSuspend() {
    setShowSuspendConfirm(false)
    setBusy(true)
    setError('')
    try {
      const updated = await setUserActive(userId, false)
      setDetail((prev) => (prev ? { ...prev, user: updated } : prev))
      onUserUpdated?.(updated)
    } catch (err) {
      setError(err.message || 'Failed to suspend user')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
          <h2 className="text-base font-semibold text-slate-800">Account detail</h2>
          <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-slate-600">
            Close
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          {loading && <p className="text-sm text-slate-400">Loading…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {detail && (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-slate-800">{detail.user.name || '—'}</span>
                  {detail.user.isAdmin && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">Admin</span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      detail.user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {detail.user.isActive ? 'Active' : 'Suspended'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      detail.user.plan === 'premium' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {detail.user.plan === 'premium' ? 'Premium' : 'Free'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{detail.user.email}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Joined {detail.user.createdAt ? new Date(detail.user.createdAt).toLocaleDateString() : '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resumes</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">{detail.resumeCount}</p>
                </div>
                <div className="rounded-md border border-slate-200 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Analyses run</p>
                  <p className="mt-1 text-xl font-bold text-slate-800">{detail.analysisCount}</p>
                </div>
              </div>

              <Section title="Recent resumes">
                {detail.resumes.length === 0 ? (
                  <EmptyRow text="No resumes yet." />
                ) : (
                  detail.resumes.map((r) => (
                    <div key={r._id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-700">{r.title || 'Untitled'}</span>
                      <span className="text-xs text-slate-400">{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}</span>
                    </div>
                  ))
                )}
              </Section>

              <Section title="Recent analyses">
                {detail.recentAnalyses.length === 0 ? (
                  <EmptyRow text="No analyses yet." />
                ) : (
                  detail.recentAnalyses.map((a) => (
                    <div key={a._id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-700">Score {a.score} · {a.resumeSource}</span>
                      <span className="text-xs text-slate-400">{a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}</span>
                    </div>
                  ))
                )}
              </Section>

              <Section title="Recent AI request activity">
                {detail.recentEvents.length === 0 ? (
                  <EmptyRow text="No AI requests recorded." />
                ) : (
                  detail.recentEvents.map((e) => (
                    <div key={e._id} className="flex items-center justify-between py-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            e.allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {e.allowed ? 'Allowed' : 'Blocked'}
                        </span>
                        <span className="text-slate-700 capitalize">{e.route}</span>
                      </div>
                      <span className="text-xs text-slate-400">{e.createdAt ? new Date(e.createdAt).toLocaleString() : '—'}</span>
                    </div>
                  ))
                )}
              </Section>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleResetLimit}
                  disabled={busy}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Reset AI quota
                </button>
                <button
                  type="button"
                  onClick={handleToggleActive}
                  disabled={busy}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {detail.user.isActive ? 'Suspend account' : 'Reactivate account'}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteRequest?.(detail.user)}
                  disabled={busy}
                  className="rounded-md border border-transparent px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete account
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showSuspendConfirm}
        title="Suspend this account?"
        message="They'll be signed out immediately and can't log back in (any provider) until reactivated."
        confirmLabel="Suspend"
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmSuspend}
        onCancel={() => setShowSuspendConfirm(false)}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="divide-y divide-slate-100 rounded-md border border-slate-200 px-3">{children}</div>
    </div>
  )
}

function EmptyRow({ text }) {
  return <p className="py-2 text-sm text-slate-400">{text}</p>
}
