import { Logo } from '../common/Logo'

const REPO_URL = 'https://github.com/OmegaZeroG/ResuLens'

function IconBuilder() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M15 4v5h5" strokeLinejoin="round" />
      <path d="M8 13h8M8 16.5h5" strokeLinecap="round" />
    </svg>
  )
}

function IconPdf() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="M7 10.5 12 15l5-4.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 18v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" strokeLinecap="round" />
    </svg>
  )
}

function IconStack() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m12 3 9 5-9 5-9-5 9-5Z" strokeLinejoin="round" />
      <path d="m3 13 9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  )
}

function IconSparkle() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"
        strokeLinecap="round"
      />
    </svg>
  )
}

const features = [
  {
    icon: IconBuilder,
    title: 'Live resume builder',
    body: 'Fill out one scrollable form and watch your resume update in real time in a live preview panel.',
  },
  {
    icon: IconPdf,
    title: 'One-click PDF export',
    body: "Download a clean, print-ready PDF whenever you're ready — no formatting fuss.",
  },
  {
    icon: IconStack,
    title: 'Multiple resumes',
    body: 'Save and manage as many tailored resumes as you need, all from one dashboard.',
  },
  {
    icon: IconLock,
    title: 'Secure sign-in',
    body: 'Email and password, or one-click sign-in with Google or GitHub.',
  },
]

export function LandingPage({ onGetStarted, onLogin }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLogin}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-indigo-50/70 to-white">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Build a resume that gets past the bots{' '}
            <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
              and impresses the humans too
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-500">
            ResuLens is a free resume builder with a live preview, instant PDF export, and
            AI-powered ATS scoring to help your resume match the job you're applying for.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onGetStarted}
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Log In
            </button>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-slate-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                  <Icon />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white">
            <IconSparkle />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">AI-powered resume analysis</h2>
            <p className="mt-1.5 text-sm text-indigo-100">
              Paste a job description and get a match score, missing keywords, and concrete
              suggestions to tailor your resume — or run a JD-free ATS check to catch formatting
              and clarity issues before you apply.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-8 text-sm text-slate-400 sm:flex-row">
          <span>Built by Om Pathrabe.</span>
          <a href={REPO_URL} className="hover:text-slate-600">
            View on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
