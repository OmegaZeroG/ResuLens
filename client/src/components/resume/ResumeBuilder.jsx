import { useState } from 'react'
import { useResume } from '../../hooks/useResume'
import { exportResumeToPdf } from '../../utils/exportPdf'
import { ContactSection } from './ContactSection'
import { SummarySection } from './SummarySection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { ProjectsSection } from './ProjectsSection'
import { CustomSectionsSection } from './CustomSectionsSection'
import { ConfirmDialog } from './ConfirmDialog'
import { TEMPLATES, getTemplate } from './templates'
import { Spinner } from '../common/Spinner'
import { StagedLoader } from '../common/StagedLoader'
import { useToast } from '../common/Toast'

export function ResumeBuilder({ user, onLogout, resumeId, onBack }) {
  const {
    resume,
    loading,
    saving,
    uploadingPhoto,
    error,
    lastSavedAt,
    setTitle,
    setContactField,
    addContactLink,
    updateContactLink,
    removeContactLink,
    setSummary,
    setSkills,
    education,
    experience,
    projects,
    customSections,
    save,
    setTemplate,
    uploadPhoto,
    removePhoto,
    resetForm,
  } = useResume(resumeId)

  const ActiveTemplate = getTemplate(resume.template).component
  const toast = useToast()

  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  async function handleDownloadPdf() {
    setExportingPdf(true)
    setExportError(null)
    try {
      const filename = `${(resume.title || 'resume').trim().replace(/\s+/g, '-').toLowerCase()}.pdf`
      await exportResumeToPdf(resume, filename)
    } catch (err) {
      setExportError(err.message)
    } finally {
      setExportingPdf(false)
    }
  }

  // `save()` now returns a boolean (see useResume.js) instead of throwing —
  // a toast confirms success without needing its own error-message
  // duplication; a failure still shows via the persistent `error` state
  // next to the buttons (not a toast — a failed save is exactly the kind
  // of thing that shouldn't be easy to miss/auto-dismiss).
  async function handleSave() {
    const ok = await save()
    if (ok) toast.success('Resume saved.')
  }

  function handleConfirmReset() {
    resetForm()
    setShowResetConfirm(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <StagedLoader active waitingText="Loading your resume…" longText="Still loading — hang tight." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 space-y-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            ← My Resumes
          </button>
          <input
            value={resume.title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:outline-none sm:w-64 sm:flex-none"
          />
          <select
            value={resume.template}
            onChange={(e) => setTemplate(e.target.value)}
            title="Template"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
          >
            {TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {(error || exportError) && (
            <span className="text-sm text-red-500">{error || exportError}</span>
          )}
          {!error && !exportError && lastSavedAt && (
            <span className="text-sm text-slate-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
          )}
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 sm:px-4"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:px-4"
          >
            {exportingPdf && <Spinner size="xs" />}
            {exportingPdf ? 'Generating…' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:px-4"
          >
            {saving && <Spinner size="xs" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3 sm:ml-1">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
            )}
            {user?.email && <span className="hidden text-sm text-slate-400 sm:inline">{user.email}</span>}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-md border border-transparent px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-2">
        <div className="space-y-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-2">
          <ContactSection
            contact={resume.sections.contact}
            onChange={setContactField}
            photoUrl={resume.photoUrl}
            onUploadPhoto={uploadPhoto}
            onRemovePhoto={removePhoto}
            uploadingPhoto={uploadingPhoto}
            onAddLink={addContactLink}
            onUpdateLink={updateContactLink}
            onRemoveLink={removeContactLink}
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
          <CustomSectionsSection
            customSections={resume.sections.customSections}
            onAdd={customSections.add}
            onUpdate={customSections.update}
            onRemove={customSections.remove}
          />
        </div>

        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
          <ActiveTemplate resume={resume} />
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
