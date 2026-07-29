import { useCallback, useEffect, useState } from 'react'
import { listResumes, deleteResume as deleteResumeApi } from '../../api/resumeApi'
import { ConfirmDialog } from '../resume/ConfirmDialog'

export function ResumeDashboard({ user, onLogout, onOpenResume, onCreateResume }) {
  const [resumes, setResumes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    listResumes()
      .then((data) => setResumes(data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return
    setDeleting(true)
    try {
      await deleteResumeApi(pendingDeleteId)
      setResumes((prev) => prev.filter((r) => r._id !== pendingDeleteId))
      setPendingDeleteId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-800">My Resumes</h1>
        <div className="flex items-center gap-3">
          {user?.avatarUrl && (
            <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
          )}
          {user?.email && <span className="text-sm text-slate-400">{user.email}</span>}
          <button
            type="button"
            onClick={onLogout}
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {resumes.length === 0
              ? 'No resumes yet.'
              : `${resumes.length} saved resume${resumes.length === 1 ? '' : 's'}.`}
          </p>
          <button
            type="button"
            onClick={onCreateResume}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            + New Resume
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : resumes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            You haven't created a resume yet. Click "New Resume" to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumes.map((r) => (
              <div
                key={r._id}
                className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-medium text-slate-500">
                      {(r.title || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {r.title || 'Untitled Resume'}
                    </p>
                    <p className="text-xs text-slate-400">
                      Updated {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenResume(r._id)}
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(r._id)}
                    className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete this resume?"
        message="This permanently removes it from your account. This can't be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
