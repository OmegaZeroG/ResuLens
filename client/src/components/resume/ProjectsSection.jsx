import { Field, TextAreaField, SectionCard } from './Field'

export function ProjectsSection({ projects, onAdd, onUpdate, onRemove }) {
  return (
    <SectionCard title="Projects" onAdd={onAdd} addLabel="+ Add project">
      {projects.length === 0 && <p className="text-sm text-slate-400">No projects added yet.</p>}
      {projects.map((proj, i) => (
        <div key={i} className="rounded-md border border-slate-100 bg-slate-50 p-4">
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="text-xs font-medium text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
          <Field label="Name" value={proj.name} onChange={(e) => onUpdate(i, 'name', e.target.value)} />
          <div className="mt-3">
            <TextAreaField
              label="Description"
              rows={2}
              value={proj.description}
              onChange={(e) => onUpdate(i, 'description', e.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field
              label="Live (optional)"
              placeholder="Live"
              value={proj.liveLink}
              onChange={(e) => onUpdate(i, 'liveLink', e.target.value)}
            />
            <Field
              label="GitHub Repo"
              placeholder="GitHub Repo"
              value={proj.githubLink}
              onChange={(e) => onUpdate(i, 'githubLink', e.target.value)}
            />
          </div>
          <div className="mt-3">
            <TextAreaField
              label="Bullet points (one per line)"
              rows={3}
              value={proj.bullets.join('\n')}
              onChange={(e) => onUpdate(i, 'bullets', e.target.value.split('\n'))}
            />
          </div>
        </div>
      ))}
    </SectionCard>
  )
}
