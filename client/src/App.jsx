import { useState } from 'react'
import { ToastProvider } from './components/common/Toast'
import { StagedLoader } from './components/common/StagedLoader'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { AuthPage } from './components/auth/AuthPage'
import { LandingPage } from './components/landing/LandingPage'
import { ResumeBuilder } from './components/resume/ResumeBuilder'
import { ResumeDashboard } from './components/dashboard/ResumeDashboard'
import { AnalyzePage } from './components/analyze/AnalyzePage'
import { AnalysisHistoryPage } from './components/analyze/AnalysisHistoryPage'
import { UsagePage } from './components/analyze/UsagePage'
import { AtsScorePage } from './components/analyze/AtsScorePage'
import { AdminPage } from './components/admin/AdminPage'

function AppShell() {
  const { user, loading, logout, authError } = useAuth()
  // 'dashboard' | 'builder' | 'analyze' | 'history' | 'usage' | 'ats' | 'admin' — which logged-in screen is showing.
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
    // This is the very first paint (verifying a stored token before we know
    // whether to show the app or the landing page) — almost always under a
    // second, so StagedLoader's 400ms delay usually means nothing renders
    // here at all rather than a flash of a spinner.
    return (
      <div className="flex min-h-screen items-center justify-center">
        <StagedLoader active waitingText="Signing you in…" longText="Still signing you in — hang tight." />
      </div>
    )
  }

  if (!user) {
    // A failed OAuth round trip lands back here with `authError` set (see
    // useAuth's init effect) but no `authMode` — the user never explicitly
    // clicked "Log in" this time, they just got bounced back from Google/
    // GitHub. Without this, the error was silently swallowed: LandingPage
    // has nowhere to show it, so the user just saw the marketing page again
    // with zero indication anything had gone wrong. Treat an OAuth error as
    // an implicit "show the login screen" so the message (and a way to
    // retry) is actually visible.
    if (authMode || authError) {
      return <AuthPage initialMode={authMode || 'login'} onBack={() => setAuthMode(null)} />
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

  if (view === 'history') {
    return (
      <AnalysisHistoryPage
        onBack={() => setView('dashboard')}
        onOpenResume={(id) => {
          setActiveResumeId(id)
          setView('builder')
        }}
      />
    )
  }

  if (view === 'usage') {
    return <UsagePage onBack={() => setView('dashboard')} />
  }

  if (view === 'ats') {
    return <AtsScorePage onBack={() => setView('dashboard')} />
  }

  // Server-side requireAdmin is the real gate — this client-side check is
  // just UX (no point rendering the screen for someone every request in it
  // will 403 for). A non-admin who somehow forces view === 'admin' just
  // falls through to the normal dashboard below instead of seeing it.
  if (view === 'admin' && user.isAdmin) {
    return <AdminPage onBack={() => setView('dashboard')} />
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
      onOpenHistory={() => setView('history')}
      onOpenUsage={() => setView('usage')}
      onOpenAtsScore={() => setView('ats')}
      onOpenAdmin={() => setView('admin')}
    />
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
