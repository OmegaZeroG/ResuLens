import { Field, TextAreaField, SectionCard } from './Field'

// Freeform sections the fixed form doesn't cover — Certifications, Awards,
// Publications, Volunteer Experience, whatever the candidate needs. Each one
// gets a user-chosen title and a list of bullet points, same shape as the
// bullets used elsewhere (Experience/Projects).
export function CustomSectionsSection({ customSections, onAdd, onUpdate, onRemove }) {
  return (
    <SectionCard title="Custom sections" onAdd={onAdd} addLabel="+ Add section">
      {customSections.length === 0 && (
        <p className="text-sm text-slate-400">
          Add a section for anything else — Certifications, Awards, Publications, Volunteer Experience, etc.
        </p>
      )}
      {customSections.map((section, i) => (
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
          <Field
            label="Section title"
            placeholder="e.g. Certifications"
            value={section.title}
            onChange={(e) => onUpdate(i, 'title', e.target.value)}
          />
          <div className="mt-3">
            <TextAreaField
              label="Content (one line per bullet)"
              rows={3}
              value={section.bullets.join('\n')}
              onChange={(e) => onUpdate(i, 'bullets', e.target.value.split('\n'))}
            />
          </div>
        </div>
      ))}
    </SectionCard>
  )
}
