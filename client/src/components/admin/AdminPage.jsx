import { useEffect, useState } from 'react'
import { listUsers, updateUserPlan, getStats, deleteUser } from '../../api/adminApi'
import { UserDetailModal } from './UserDetailModal'
import { ConfirmDialog } from '../resume/ConfirmDialog'
import { SkeletonTableRows, SkeletonLine } from '../common/Skeleton'
import { EmptyState } from '../common/EmptyState'
import { ErrorState } from '../common/ErrorState'
import { useToast } from '../common/Toast'
import { Spinner } from '../common/Spinner'

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
      <path d="M16 8.5a2.5 2.5 0 1 1 0-5M17 14.2c2.3.4 4 2.2 4 4.8" strokeLinecap="round" />
    </svg>
  )
}

// Only reachable if user.isAdmin is true (see App.jsx / ResumeDashboard.jsx) —
// but that's just UX, the real gate is the server's requireAdmin middleware.
// A non-admin who somehow lands here would just see every request fail with
// "Admin access required."
export function AdminPage({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')

  const [detailUserId, setDetailUserId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null) // the user object, or null
  const [deleting, setDeleting] = useState(false)

  const toast = useToast()

  function load(q) {
    setLoading(true)
    setError('')
    listUsers(q)
      .then(setUsers)
      .catch((err) => setError(err.message || 'Could not load users'))
      .finally(() => setLoading(false))
  }

  function loadStats() {
    setStatsError('')
    getStats()
      .then(setStats)
      .catch((err) => setStatsError(err.message || 'Could not load stats'))
  }

  useEffect(() => {
    load('')
    loadStats()
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    load(query)
  }

  // Each row's own action gets its own feedback (a toast), independent of
  // the table's load state — one user's plan update failing shouldn't read
  // as "the whole table is broken," and shouldn't block interacting with
  // any other row while it's in flight.
  async function handleTogglePlan(user) {
    const nextPlan = user.plan === 'premium' ? 'free' : 'premium'
    setUpdatingId(user.id)
    try {
      const updated = await updateUserPlan(user.id, nextPlan)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      toast.success(`${updated.name || updated.email} moved to ${updated.plan === 'premium' ? 'Premium' : 'Free'}.`)
    } catch (err) {
      toast.error(err.message || 'Failed to update plan')
    } finally {
      setUpdatingId(null)
    }
  }

  function handleUserUpdatedFromModal(updated) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteUser(pendingDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== pendingDelete.id))
      setPendingDelete(null)
      setDetailUserId(null)
      toast.success('Account deleted.')
    } catch (err) {
      toast.error(err.message || 'Failed to delete user')
    } finally {
      setDeleting(false)
    }
  }

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
          <h1 className="text-lg font-semibold text-slate-800">Admin</h1>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-2 sm:w-auto">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="min-w-0 flex-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none sm:w-64 sm:flex-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <StatsPanel stats={stats} error={statsError} onRetry={loadStats} />

        {error && <ErrorState title="Couldn't load users" message={error} onRetry={() => load(query)} />}

        {loading ? (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Joined</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows rows={5} cols={5} />
              </tbody>
            </table>
          </div>
        ) : error ? null : users.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={query ? 'No matching users' : 'No users yet'}
            description={query ? `Nothing matches "${query}".` : 'Once people sign up, they’ll show up here.'}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[640px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Plan</th>
                  <th className="px-4 py-2.5">Joined</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">
                      <button
                        type="button"
                        onClick={() => setDetailUserId(u.id)}
                        className="text-left hover:underline"
                      >
                        {u.name || '—'}
                      </button>
                      {u.isAdmin && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          Admin
                        </span>
                      )}
                      {u.isActive === false && (
                        <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.plan === 'premium' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.plan === 'premium' ? 'Premium' : 'Free'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailUserId(u.id)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTogglePlan(u)}
                          disabled={updatingId === u.id}
                          className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {updatingId === u.id && <Spinner size="xs" />}
                          {updatingId === u.id
                            ? 'Updating…'
                            : u.plan === 'premium'
                              ? 'Downgrade'
                              : 'Upgrade'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(u)}
                          className="rounded-md border border-transparent px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailUserId && (
        <UserDetailModal
          userId={detailUserId}
          onClose={() => setDetailUserId(null)}
          onUserUpdated={handleUserUpdatedFromModal}
          onDeleteRequest={(user) => setPendingDelete(user)}
        />
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.name || pendingDelete?.email || 'this account'}?`}
        message="Permanently deletes the account and all of its resumes, analyses, and usage history. This can't be undone."
        confirmLabel={
          deleting ? (
            <span className="flex items-center gap-1.5">
              <Spinner size="xs" />
              Deleting…
            </span>
          ) : (
            'Delete'
          )
        }
        confirmDisabled={deleting}
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}

function StatsPanel({ stats, error, onRetry }) {
  if (error) return <ErrorState title="Couldn't load platform stats" message={error} onRetry={onRetry} />

  if (!stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <SkeletonLine className="h-3 w-3/5" />
              <SkeletonLine className="mt-2 h-6 w-1/3" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <SkeletonLine className="mb-3 h-3 w-40" />
          <SkeletonLine className="h-24 w-full" />
        </div>
      </div>
    )
  }

  const maxCount = Math.max(1, ...stats.signups.map((d) => d.count))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={stats.totalUsers} />
        <StatCard label="Premium" value={stats.premiumUsers} tone="good" />
        <StatCard label="Free" value={stats.freeUsers} />
        <StatCard label="Suspended" value={stats.suspendedUsers} tone={stats.suspendedUsers > 0 ? 'bad' : 'neutral'} />
        <StatCard label="Resumes" value={stats.totalResumes} />
        <StatCard label="Analyses run" value={stats.totalAnalyses} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Signups — last 14 days
        </h2>
        <div className="overflow-x-auto">
          <div className="flex h-24 min-w-[480px] items-end gap-1.5">
            {stats.signups.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{ height: `${Math.max(4, (d.count / maxCount) * 80)}px` }}
                />
                <span className="text-[10px] text-slate-400">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone = 'neutral' }) {
  const toneClass = tone === 'good' ? 'text-emerald-600' : tone === 'bad' ? 'text-red-600' : 'text-slate-800'
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  )
}
