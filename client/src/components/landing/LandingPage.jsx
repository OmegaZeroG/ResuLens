import { useEffect, useRef, useState } from 'react'
import { Logo } from '../common/Logo'

const REPO_URL = 'https://github.com/OmegaZeroG/ResuLens'

// Small scroll-reveal wrapper — fades + slides an element up once it enters
// the viewport, then disconnects (no need to keep observing after it's
// played once). Plain IntersectionObserver + Tailwind transition utilities,
// no animation library needed for something this simple. `delay` lets a
// group of siblings (e.g. a feature grid) stagger in one after another
// instead of all popping in at once.
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
      className={`transition-all duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  )
}

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

function IconPalette() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconImage() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m5 17 4.5-4.5a2 2 0 0 1 2.8 0L15 15.2M14 14l1.3-1.3a2 2 0 0 1 2.8 0L20 14.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
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
    icon: IconPalette,
    title: '5 professional templates',
    body: 'Classic, Jake’s Resume, Compact Two-Column, Modern, and Harvard — switch anytime, preview updates instantly.',
  },
  {
    icon: IconPdf,
    title: 'One-click PDF export',
    body: 'Real selectable, ATS-parseable text with clickable links and correct pagination — not a screenshot.',
  },
  {
    icon: IconImage,
    title: 'AI photo background removal',
    body: 'Face-centered cropping plus one-click background removal, with a solid-color fill or transparent option.',
  },
  {
    icon: IconStack,
    title: 'Multiple resumes',
    body: 'Save and manage as many tailored resumes as you need, all from one dashboard.',
  },
  {
    icon: IconTarget,
    title: 'JD-free ATS check',
    body: 'Structural and AI content-quality scoring catches formatting and clarity issues before you apply.',
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

      <section className="overflow-hidden bg-gradient-to-b from-indigo-50/70 to-white">
        <Reveal className="mx-auto max-w-3xl px-6 py-20 text-center">
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
              className="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-200"
            >
              Get Started Free
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="rounded-md border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
            >
              Log In
            </button>
          </div>
        </Reveal>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Everything you need, built in</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Every feature below is live in the app right now — nothing here is a placeholder.
            </p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 80}>
                <div className="group h-full rounded-lg border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 transition-colors duration-300 group-hover:bg-indigo-600 group-hover:text-white">
                    <Icon />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-slate-800">{title}</h3>
                  <p className="mt-1.5 text-sm text-slate-500">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600">
        <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-14 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white transition-transform duration-500 hover:rotate-12">
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
        </Reveal>
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
