import { Field, TextAreaField, SectionCard } from './Field'

export function ExperienceSection({ experience, onAdd, onUpdate, onRemove }) {
  return (
    <SectionCard title="Experience" onAdd={onAdd} addLabel="+ Add experience">
      {experience.length === 0 && <p className="text-sm text-slate-400">No experience added yet.</p>}
      {experience.map((exp, i) => (
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
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Company"
              value={exp.company}
              onChange={(e) => onUpdate(i, 'company', e.target.value)}
            />
            <Field label="Role" value={exp.role} onChange={(e) => onUpdate(i, 'role', e.target.value)} />
            <Field
              label="Location"
              value={exp.location}
              onChange={(e) => onUpdate(i, 'location', e.target.value)}
            />
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={exp.current}
                onChange={(e) => onUpdate(i, 'current', e.target.checked)}
              />
              I currently work here
            </label>
            <Field
              label="Start date"
              placeholder="Jun 2025"
              value={exp.startDate}
              onChange={(e) => onUpdate(i, 'startDate', e.target.value)}
            />
            <Field
              label="End date"
              placeholder="Present"
              value={exp.endDate}
              disabled={exp.current}
              onChange={(e) => onUpdate(i, 'endDate', e.target.value)}
            />
          </div>
          <div className="mt-3">
            <TextAreaField
              label="Bullet points (one per line)"
              rows={3}
              value={exp.bullets.join('\n')}
              onChange={(e) => onUpdate(i, 'bullets', e.target.value.split('\n'))}
            />
          </div>
        </div>
      ))}
    </SectionCard>
  )
}
