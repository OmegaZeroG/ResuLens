import { useEffect, useState } from 'react'
import { listResumes } from '../../api/resumeApi'
import { scoreAts } from '../../api/analyzeApi'
import { ScoreRing } from './AnalysisVisuals'
import { useRateLimitInfo } from '../../hooks/useRateLimitInfo'
import { useCountdown, formatCountdown } from '../../hooks/useCountdown'
import { QuotaBadge } from './QuotaBadge'

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt'

function MiniScore({ label, value }) {
  const color = value >= 75 ? 'text-emerald-600' : value >= 50 ? 'text-amber-600' : 'text-red-600'
  return (
    <div className="flex-1 rounded-lg border border-slate-200 bg-white p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  )
}

function CheckRow({ check }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          check.pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {check.pass ? '✓' : '!'}
      </span>
      <div>
        <p className="text-sm font-medium text-slate-800">{check.label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{check.detail}</p>
      </div>
    </div>
  )
}

function TextList({ items, tone }) {
  if (!items?.length) return <p className="text-sm text-slate-400">None</p>
  const dotClass = tone === 'good' ? 'text-emerald-500' : tone === 'bad' ? 'text-red-500' : 'text-indigo-500'
  return (
    <ul className="space-y-2 text-sm text-slate-600">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className={dotClass}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

// Independent ATS score — unlike AnalyzePage, this is NOT matched against a
// job description. It scores how ATS-friendly and well-written the resume
// is in general: deterministic structural checks (atsRules.js, run
// server-side) plus an AI-judged content-quality pass (geminiAtsContent.js).
export function AtsScorePage({ onBack }) {
  const [resumes, setResumes] = useState([])
  const [resumeMode, setResumeMode] = useState('saved') // 'saved' | 'upload'
  const [resumeId, setResumeId] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    listResumes()
      .then((data) => {
        const list = data || []
        setResumes(list)
        if (list.length === 0) setResumeMode('upload')
        else setResumeId(list[0]._id)
      })
      .catch(() => setResumeMode('upload'))
  }, [])

  const rateLimitInfo = useRateLimitInfo()
  const quotaExhausted = rateLimitInfo?.remaining === 0
  const secondsUntilReset = useCountdown(quotaExhausted ? rateLimitInfo.resetAt : null)
  const quotaBlocked = quotaExhausted && secondsUntilReset > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (resumeMode === 'saved' && !resumeId) {
      setError('Choose a saved resume, or switch to uploading a file')
      return
    }
    if (resumeMode === 'upload' && !resumeFile) {
      setError('Upload a resume file')
      return
    }

    setSubmitting(true)
    setResult(null)
    try {
      const data = await scoreAts({
        resumeId: resumeMode === 'saved' ? resumeId : undefined,
        resumeFile: resumeMode === 'upload' ? resumeFile : undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Scoring failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← My Resumes
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Independent ATS score</h1>
        </div>
        <QuotaBadge info={rateLimitInfo} />
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-500">
            Checks how ATS-friendly and well-written your resume is in general — not matched against any
            specific job. For a match against a job description, use "Analyze against a job" instead.
          </p>

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-800">Resume</span>
            <div className="mb-3 flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setResumeMode('saved')}
                disabled={resumes.length === 0}
                className={`rounded-md px-3 py-1.5 font-medium disabled:opacity-40 ${
                  resumeMode === 'saved' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Use a saved resume
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('upload')}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  resumeMode === 'upload' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Upload a file
              </button>
            </div>

            {resumeMode === 'saved' ? (
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.title || 'Untitled Resume'}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {quotaBlocked && (
            <p className="text-sm text-amber-600">
              Out of AI requests for this hour — try again in {formatCountdown(secondsUntilReset)}.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || quotaBlocked}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Scoring…' : quotaBlocked ? `Try again in ${formatCountdown(secondsUntilReset)}` : 'Check ATS score'}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {!result && !submitting && (
            <p className="text-sm text-slate-400">
              Results will show up here — an overall ATS-readiness score, a checklist of structural issues
              that could trip up a real ATS parser, and AI feedback on your writing quality.
            </p>
          )}
          {submitting && <p className="text-sm text-slate-400">Scoring your resume…</p>}

          {result && !submitting && (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.overallScore} />
                <p className="text-sm text-slate-500">
                  Overall ATS readiness — a blend of structural parseability and writing quality, independent
                  of any specific job.
                </p>
              </div>

              <div className="flex gap-3">
                <MiniScore label="Structure" value={result.structureScore} />
                <MiniScore label="Content" value={result.contentScore} />
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Structure checklist</h3>
                <div className="divide-y divide-slate-100">
                  {result.structureChecks.map((check) => (
                    <CheckRow key={check.id} check={check} />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Writing strengths</h3>
                <TextList items={result.content.strengths} tone="good" />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Writing weaknesses</h3>
                <TextList items={result.content.weaknesses} tone="bad" />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggestions</h3>
                <TextList items={result.content.suggestions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
