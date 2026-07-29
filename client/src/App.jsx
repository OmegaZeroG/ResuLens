import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { ResumeBuilder } from './components/resume/ResumeBuilder'
import { ResumeDashboard } from './components/dashboard/ResumeDashboard'

function AppShell() {
  const { user, loading, logout } = useAuth()
  // undefined = show the dashboard, null = editing a brand new (unsaved) resume,
  // a string = editing that resume's _id.
  const [activeResumeId, setActiveResumeId] = useState(undefined)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  if (activeResumeId === undefined) {
    return (
      <ResumeDashboard
        user={user}
        onLogout={logout}
        onCreateResume={() => setActiveResumeId(null)}
        onOpenResume={(id) => setActiveResumeId(id)}
      />
    )
  }

  return (
    <ResumeBuilder
      user={user}
      onLogout={logout}
      resumeId={activeResumeId}
      onBack={() => setActiveResumeId(undefined)}
    />
  )
}

function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  )
}

export default App
