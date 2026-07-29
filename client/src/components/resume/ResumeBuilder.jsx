import { useRef, useState } from 'react'
import { useResume } from '../../hooks/useResume'
import { exportElementToPdf } from '../../utils/exportPdf'
import { ContactSection } from './ContactSection'
import { SummarySection } from './SummarySection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { ProjectsSection } from './ProjectsSection'
import { ResumePreview } from './ResumePreview'
import { ConfirmDialog } from './ConfirmDialog'

export function ResumeBuilder() {
  const {
    resume,
    loading,
    saving,
    uploadingPhoto,
    error,
    lastSavedAt,
    setTitle,
    setContactField,
    setSummary,
    setSkills,
    education,
    experience,
    projects,
    save,
    uploadPhoto,
    removePhoto,
    resetForm,
  } = useResume()

  const previewRef = useRef(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  async function handleDownloadPdf() {
    if (!previewRef.current) return
    setExportingPdf(true)
    setExportError(null)
    try {
      const filename = `${(resume.title || 'resume').trim().replace(/\s+/g, '-').toLowerCase()}.pdf`
      await exportElementToPdf(previewRef.current, filename)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExportingPdf(false)
    }
  }

  function handleConfirmReset() {
    resetForm()
    setShowResetConfirm(false)
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <input
          value={resume.title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-64 rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          {(error || exportError) && (
            <span className="text-sm text-red-500">{error || exportError}</span>
          )}
          {!error && !exportError && lastSavedAt && (
            <span className="text-sm text-slate-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-md border border-transparent px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exportingPdf ? 'Generating…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="max-h-[calc(100vh-5rem)] space-y-4 overflow-y-auto pr-2">
          <ContactSection
            contact={resume.sections.contact}
            onChange={setContactField}
            photoUrl={resume.photoUrl}
            onUploadPhoto={uploadPhoto}
            onRemovePhoto={removePhoto}
            uploadingPhoto={uploadingPhoto}
          />
          <SummarySection summary={resume.sections.summary} onChange={setSummary} />
          <EducationSection
            education={resume.sections.education}
            onAdd={education.add}
            onUpdate={education.update}
            onRemove={education.remove}
          />
          <ExperienceSection
            experience={resume.sections.experience}
            onAdd={experience.add}
            onUpdate={experience.update}
            onRemove={experience.remove}
          />
          <SkillsSection skills={resume.sections.skills} onChange={setSkills} />
          <ProjectsSection
            projects={resume.sections.projects}
            onAdd={projects.add}
            onUpdate={projects.update}
            onRemove={projects.remove}
          />
        </div>

        <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto">
          <ResumePreview ref={previewRef} resume={resume} />
        </div>
      </div>

      <ConfirmDialog
        open={showResetConfirm}
        title="Clear the entire form?"
        message="This only clears what you see here — your last saved resume stays in the database until you click Save again."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        danger
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  )
}
