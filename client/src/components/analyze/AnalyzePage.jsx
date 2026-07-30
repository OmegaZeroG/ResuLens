import { useEffect, useState } from 'react'
import { listResumes } from '../../api/resumeApi'
import { analyze, improveResume } from '../../api/analyzeApi'
import { ScoreRing, KeywordChips } from './AnalysisVisuals'

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.txt'
const IMPROVE_THRESHOLD = 85

export function AnalyzePage({ onBack, onOpenResume }) {
  const [resumes, setResumes] = useState([])
  const [resumeMode, setResumeMode] = useState('saved') // 'saved' | 'upload'
  const [resumeId, setResumeId] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [jdMode, setJdMode] = useState('text') // 'text' | 'upload'
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [improving, setImproving] = useState(false)
  const [improveError, setImproveError] = useState('')
  const [improved, setImproved] = useState(null) // { resume, analysis } once generated

  useEffect(() => {
    listResumes()
      .then((data) => {
        const list = data || []
        setResumes(list)
        if (list.length === 0) setResumeMode('upload')
        else setResumeId(list[0]._id)
      })
      .catch(() => {
        setResumeMode('upload')
      })
  }, [])

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
    if (jdMode === 'text' && !jdText.trim()) {
      setError('Paste the job description, or switch to uploading a file')
      return
    }
    if (jdMode === 'upload' && !jdFile) {
      setError('Upload a job description file')
      return
    }

    setSubmitting(true)
    setResult(null)
    setImproved(null)
    setImproveError('')
    try {
      const data = await analyze({
        resumeId: resumeMode === 'saved' ? resumeId : undefined,
        resumeFile: resumeMode === 'upload' ? resumeFile : undefined,
        jdText: jdMode === 'text' ? jdText.trim() : undefined,
        jdFile: jdMode === 'upload' ? jdFile : undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Analysis failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Reuses the exact same resume/JD inputs the analysis just ran with, plus
  // the missing-keyword list from that result as a hint for what to target.
  // Always creates a brand new resume — never touches the one just analyzed.
  async function handleImprove() {
    setImproveError('')
    setImproving(true)
    try {
      const data = await improveResume({
        resumeId: resumeMode === 'saved' ? resumeId : undefined,
        resumeFile: resumeMode === 'upload' ? resumeFile : undefined,
        jdText: jdMode === 'text' ? jdText.trim() : undefined,
        jdFile: jdMode === 'upload' ? jdFile : undefined,
        missingKeywords: result?.missingKeywords,
      })
      setImproved(data)
    } catch (err) {
      setImproveError(err.message || 'Could not generate an improved resume')
    } finally {
      setImproving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← My Resumes
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Analyze against a job description</h1>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
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

          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-800">Job description</span>
            <div className="mb-3 flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setJdMode('text')}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  jdMode === 'text' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Paste text
              </button>
              <button
                type="button"
                onClick={() => setJdMode('upload')}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  jdMode === 'upload' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Upload a file
              </button>
            </div>

            {jdMode === 'text' ? (
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={10}
                placeholder="Paste the job description here…"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            ) : (
              <input
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Analyzing…' : 'Analyze'}
          </button>
        </form>

        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {!result && !submitting && (
            <p className="text-sm text-slate-400">
              Results will show up here once you run an analysis — a match score, keywords the
              job description mentions that are (and aren't) in your resume, and suggestions to
              close the gap.
            </p>
          )}
          {submitting && <p className="text-sm text-slate-400">Analyzing against the job description…</p>}

          {result && !submitting && (
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <ScoreRing score={result.score} />
                <p className="text-sm text-slate-500">
                  Overall match between this resume and the job description, based on relevant
                  skills, experience, and keyword overlap.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Matched keywords</h3>
                <KeywordChips items={result.matchedKeywords} tone="good" />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Missing keywords</h3>
                <KeywordChips items={result.missingKeywords} tone="bad" />
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Suggestions</h3>
                {result.suggestions?.length ? (
                  <ul className="space-y-2 text-sm text-slate-600">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-indigo-500">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">None</p>
                )}
              </div>

              {result.score < IMPROVE_THRESHOLD && !improved && (
                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="button"
                    onClick={handleImprove}
                    disabled={improving}
                    className="w-full rounded-md bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50"
                  >
                    {improving ? 'Rewriting your resume for this job…' : 'Improve my resume for this job'}
                  </button>
                  <p className="mt-2 text-xs text-slate-400">
                    Creates a new resume tailored to this job description — rephrased and
                    reordered to better match it, without inventing anything untrue. Your
                    original resume is never changed. The resulting score depends on how well
                    your real experience actually lines up with the role.
                  </p>
                  {improveError && <p className="mt-2 text-sm text-red-500">{improveError}</p>}
                </div>
              )}

              {improved && (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-5">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={improved.analysis.score} />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {improved.analysis.score > result.score
                          ? `Improved resume created — score went from ${result.score} to ${improved.analysis.score}`
                          : `Improved resume created — new score: ${improved.analysis.score}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Saved as "{improved.resume.title}" in My Resumes. Review it before using
                        it — nothing was fabricated, but always double-check AI-written wording.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenResume?.(improved.resume._id)}
                    className="mt-4 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Open improved resume in builder
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
