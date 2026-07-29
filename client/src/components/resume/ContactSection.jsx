import { Field, SectionCard } from './Field'

export function ContactSection({ contact, onChange }) {
  return (
    <SectionCard title="Contact info">
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Full name"
          value={contact.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
        />
        <Field
          label="Email"
          type="email"
          value={contact.email}
          onChange={(e) => onChange('email', e.target.value)}
        />
        <Field label="Phone" value={contact.phone} onChange={(e) => onChange('phone', e.target.value)} />
        <Field
          label="Location"
          value={contact.location}
          onChange={(e) => onChange('location', e.target.value)}
        />
        <Field
          label="LinkedIn"
          value={contact.linkedin}
          onChange={(e) => onChange('linkedin', e.target.value)}
        />
        <Field
          label="Portfolio / GitHub"
          value={contact.portfolio}
          onChange={(e) => onChange('portfolio', e.target.value)}
        />
      </div>
    </SectionCard>
  )
}
