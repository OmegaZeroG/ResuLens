import { useResume } from '../../hooks/useResume'
import { ContactSection } from './ContactSection'
import { SummarySection } from './SummarySection'
import { EducationSection } from './EducationSection'
import { ExperienceSection } from './ExperienceSection'
import { SkillsSection } from './SkillsSection'
import { ProjectsSection } from './ProjectsSection'
import { ResumePreview } from './ResumePreview'

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
  } = useResume()

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
          {error && <span className="text-sm text-red-500">{error}</span>}
          {!error && lastSavedAt && (
            <span className="text-sm text-slate-400">Saved {lastSavedAt.toLocaleTimeString()}</span>
          )}
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
          <ResumePreview resume={resume} />
        </div>
      </div>
    </div>
  )
}
