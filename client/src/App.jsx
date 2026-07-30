import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { LandingPage } from './components/landing/LandingPage'
import { ResumeBuilder } from './components/resume/ResumeBuilder'
import { ResumeDashboard } from './components/dashboard/ResumeDashboard'
import { AnalyzePage } from './components/analyze/AnalyzePage'

function AppShell() {
  const { user, loading, logout } = useAuth()
  // 'dashboard' | 'builder' | 'analyze' — which logged-in screen is showing.
  const [view, setView] = useState('dashboard')
  // Only meaningful when view === 'builder': null = a brand new (unsaved)
  // resume, a string = editing that resume's _id.
  const [activeResumeId, setActiveResumeId] = useState(null)
  // null = show the public landing page, 'login' | 'signup' = show AuthPage in that mode.
  const [authMode, setAuthMode] = useState(null)

  // Logging out should drop you back on the landing page, not straight into
  // the login form, and reset any in-progress navigation state.
  function handleLogout() {
    logout()
    setAuthMode(null)
    setView('dashboard')
    setActiveResumeId(null)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    )
  }

  if (!user) {
    if (authMode) {
      return <AuthPage initialMode={authMode} onBack={() => setAuthMode(null)} />
    }
    return (
      <LandingPage onGetStarted={() => setAuthMode('signup')} onLogin={() => setAuthMode('login')} />
    )
  }

  if (view === 'analyze') {
    return (
      <AnalyzePage
        onBack={() => setView('dashboard')}
        onOpenResume={(id) => {
          setActiveResumeId(id)
          setView('builder')
        }}
      />
    )
  }

  if (view === 'builder') {
    return (
      <ResumeBuilder
        user={user}
        onLogout={handleLogout}
        resumeId={activeResumeId}
        onBack={() => setView('dashboard')}
      />
    )
  }

  return (
    <ResumeDashboard
      user={user}
      onLogout={handleLogout}
      onCreateResume={() => {
        setActiveResumeId(null)
        setView('builder')
      }}
      onOpenResume={(id) => {
        setActiveResumeId(id)
        setView('builder')
      }}
      onOpenAnalyze={() => setView('analyze')}
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
