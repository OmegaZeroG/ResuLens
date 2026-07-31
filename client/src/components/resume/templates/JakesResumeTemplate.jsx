import { forwardRef } from 'react'
import { withProtocol } from '../../../utils/links'

// A faithful recreation of "Jake's Resume" (the well-known Overleaf LaTeX
// template — see TASKS.md Phase 8 for the research trail). Deliberately
// different in character from the default template, not just a re-skin:
//   - Serif type throughout (Jake's is set in a LaTeX serif face) instead of
//     the default template's sans-serif.
//   - Centered header with a single plain-text contact line, no icons — the
//     original avoids anything that isn't plain parseable text.
//   - No photo, on purpose. Jake's Resume is the "maximum ATS safety" choice
//     of the template set; some ATS parsers still trip on embedded images in
//     the header, and the original design never had one. If a photo is set
//     on the resume, this template just doesn't render it (not a bug).
//   - Thin full-width rule directly under each section heading, tighter
//     line spacing, right-aligned dates on their own line pattern — the
//     specific layout details that make it recognizable as *this* template
//     rather than a generic single-column resume.
function SectionHeading({ children }) {
  return (
    <h2 className="mb-1.5 border-b border-slate-800 pb-0.5 text-[12px] font-bold uppercase tracking-wide text-slate-900">
      {children}
    </h2>
  )
}

function EntryHeader({ left, right, subLeft, subRight }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-bold text-slate-900">{left}</span>
        {right && <span className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-slate-700">{right}</span>}
      </div>
      {(subLeft || subRight) && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[12px] italic text-slate-700">{subLeft}</span>
          {subRight && <span className="shrink-0 whitespace-nowrap text-[11px] italic text-slate-600">{subRight}</span>}
        </div>
      )}
    </div>
  )
}

function dateRange(startDate, endDate, current) {
  if (!startDate && !endDate && !current) return ''
  return `${startDate || ''}${startDate && (endDate || current) ? ' – ' : ''}${current ? 'Present' : endDate || ''}`
}

export const JakesResumeTemplate = forwardRef(function JakesResumeTemplate({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  const contactPieces = [
    contact.phone,
    contact.email,
    ...(contact.links || []).filter((l) => l.url).map((l) => l.label || l.url),
  ].filter(Boolean)

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[8.5in] rounded-lg border border-slate-200 bg-white p-10 font-serif text-slate-800 shadow-sm"
    >
      <header className="text-center">
        <h1 className="text-xl font-bold tracking-wide text-slate-900">{contact.fullName || 'Your Name'}</h1>
        {contactPieces.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center justify-center gap-x-1.5 text-[11px] text-slate-600">
            {contactPieces.map((piece, i) => {
              const link = (contact.links || []).find((l) => (l.label || l.url) === piece)
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-400">|</span>}
                  {link ? (
                    <a
                      href={withProtocol(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-600 hover:underline"
                    >
                      {piece}
                    </a>
                  ) : piece === contact.email ? (
                    <a href={`mailto:${contact.email}`} className="hover:text-indigo-600 hover:underline">
                      {piece}
                    </a>
                  ) : (
                    <span>{piece}</span>
                  )}
                </span>
              )
            })}
          </p>
        )}
      </header>

      {summary && (
        <section className="mt-4">
          <SectionHeading>Summary</SectionHeading>
          <p className="text-[12.5px] leading-snug text-slate-700">{summary}</p>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-4">
          <SectionHeading>Education</SectionHeading>
          <div className="space-y-2">
            {education.map((edu, i) => (
              <EntryHeader
                key={i}
                left={edu.school}
                right={dateRange(edu.startDate, edu.endDate)}
                subLeft={[edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')}
                subRight={edu.gpa && `GPA: ${edu.gpa}`}
              />
            ))}
          </div>
        </section>
      )}

      {experience.length > 0 && (
        <section className="mt-4">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-2.5">
            {experience.map((exp, i) => (
              <div key={i}>
                <EntryHeader
                  left={exp.role}
                  right={dateRange(exp.startDate, exp.endDate, exp.current)}
                  subLeft={exp.company}
                  subRight={exp.location}
                />
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-slate-700">
                    {exp.bullets.filter(Boolean).map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="mt-4">
          <SectionHeading>Projects</SectionHeading>
          <div className="space-y-2.5">
            {projects.map((proj, i) => {
              const links = [proj.liveLink, proj.githubLink].filter(Boolean).map(withProtocol)
              return (
                <div key={i}>
                  <EntryHeader left={proj.name} right={links.length > 0 ? links.join(' | ') : ''} />
                  {proj.description && <p className="text-[12px] leading-snug text-slate-700">{proj.description}</p>}
                  {proj.bullets.filter(Boolean).length > 0 && (
                    <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-slate-700">
                      {proj.bullets.filter(Boolean).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-4">
          <SectionHeading>Technical Skills</SectionHeading>
          <p className="text-[12.5px] leading-snug text-slate-700">{skills.join(', ')}</p>
        </section>
      )}

      {customSections
        .filter((section) => section.title || section.bullets.filter(Boolean).length > 0)
        .map((section, i) => (
          <section key={i} className="mt-4">
            <SectionHeading>{section.title || 'Additional'}</SectionHeading>
            {section.bullets.filter(Boolean).length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-slate-700">
                {section.bullets.filter(Boolean).map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </div>
  )
})
