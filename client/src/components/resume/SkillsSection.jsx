import { Field, SectionCard } from './Field'

export function SkillsSection({ skills, onChange }) {
  return (
    <SectionCard title="Skills">
      <Field
        label="Comma-separated (e.g. React, Node.js, MongoDB)"
        value={skills.join(', ')}
        onChange={(e) => onChange(e.target.value)}
      />
    </SectionCard>
  )
}
