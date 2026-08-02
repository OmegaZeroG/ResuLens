import { Field, SectionCard } from './Field'

export function EducationSection({ education, onAdd, onUpdate, onRemove }) {
  return (
    <SectionCard title="Education" onAdd={onAdd} addLabel="+ Add education">
      {education.length === 0 && <p className="text-sm text-slate-400">No education added yet.</p>}
      {education.map((edu, i) => (
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="School" value={edu.school} onChange={(e) => onUpdate(i, 'school', e.target.value)} />
            <Field label="Degree" value={edu.degree} onChange={(e) => onUpdate(i, 'degree', e.target.value)} />
            <Field
              label="Field of study"
              value={edu.fieldOfStudy}
              onChange={(e) => onUpdate(i, 'fieldOfStudy', e.target.value)}
            />
            <Field label="GPA" value={edu.gpa} onChange={(e) => onUpdate(i, 'gpa', e.target.value)} />
            <Field
              label="Start date"
              placeholder="Aug 2022"
              value={edu.startDate}
              onChange={(e) => onUpdate(i, 'startDate', e.target.value)}
            />
            <Field
              label="End date"
              placeholder="May 2026"
              value={edu.endDate}
              onChange={(e) => onUpdate(i, 'endDate', e.target.value)}
            />
          </div>
        </div>
      ))}
    </SectionCard>
  )
}
