import { TextAreaField, SectionCard } from './Field'

export function SummarySection({ summary, onChange }) {
  return (
    <SectionCard title="Summary">
      <TextAreaField
        label="A 2-3 sentence pitch"
        rows={4}
        value={summary}
        onChange={(e) => onChange(e.target.value)}
      />
    </SectionCard>
  )
}
