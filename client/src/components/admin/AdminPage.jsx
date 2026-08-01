import { useEffect, useState } from 'react'
import { listUsers, updateUserPlan } from '../../api/adminApi'

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

  function load(q) {
    setLoading(true)
    setError('')
    listUsers(q)
      .then(setUsers)
      .catch((err) => setError(err.message || 'Could not load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load('')
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    load(query)
  }

  async function handleTogglePlan(user) {
    const nextPlan = user.plan === 'premium' ? 'free' : 'premium'
    setUpdatingId(user.id)
    setError('')
    try {
      const updated = await updateUserPlan(user.id, nextPlan)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(err.message || 'Failed to update plan')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← My Resumes
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Admin — Users</h1>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email"
            className="w-64 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-800 focus:border-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Search
          </button>
        </form>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-slate-400">No users found.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
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
                      {u.name || '—'}
                      {u.isAdmin && (
                        <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          Admin
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
                    <td className="px-4 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleTogglePlan(u)}
                        disabled={updatingId === u.id}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {updatingId === u.id
                          ? 'Updating…'
                          : u.plan === 'premium'
                            ? 'Downgrade to Free'
                            : 'Upgrade to Premium'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
