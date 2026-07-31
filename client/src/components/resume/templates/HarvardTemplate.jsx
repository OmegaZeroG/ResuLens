import { forwardRef } from 'react'
import { withProtocol } from '../../../utils/links'

// Traditional academic CV format — the most formal and most conservative of
// the five templates on purpose: pure black/white/gray serif (no indigo, no
// color anywhere), centered header, centered section labels with a full-
// width rule. No photo (same reasoning as Jake's Resume: a formal academic
// CV never has one, and it's one less thing to distract from the content).
// Education is listed before Experience, matching the convention this style
// is named for.

function CenteredHeading({ children }) {
  return (
    <div className="mb-2 mt-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-400" />
      <h2 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-800">{children}</h2>
      <div className="h-px flex-1 bg-slate-400" />
    </div>
  )
}

function EntryRow({ left, right, subLeft, subRight }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-slate-900">{left}</span>
        {right && <span className="shrink-0 whitespace-nowrap text-xs text-slate-600">{right}</span>}
      </div>
      {(subLeft || subRight) && (
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs italic text-slate-700">{subLeft}</span>
          {subRight && <span className="shrink-0 whitespace-nowrap text-xs italic text-slate-500">{subRight}</span>}
        </div>
      )}
    </div>
  )
}

export const HarvardTemplate = forwardRef(function HarvardTemplate({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  const contactPieces = [
    contact.location,
    contact.phone,
    contact.email,
    ...(contact.links || []).filter((l) => l.url),
  ].filter(Boolean)

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[8.5in] rounded-lg border border-slate-200 bg-white p-10 font-serif text-slate-800 shadow-sm"
    >
      <header className="text-center">
        <h1 className="text-2xl font-bold uppercase tracking-[0.15em] text-slate-900">
          {contact.fullName || 'Your Name'}
        </h1>
        <div className="mx-auto mt-2 h-px w-24 bg-slate-800" />
        {contactPieces.length > 0 && (
          <p className="mt-2 flex flex-wrap items-center justify-center gap-x-1.5 text-[11px] text-slate-600">
            {contactPieces.map((piece, i) => {
              const isLink = typeof piece !== 'string'
              const text = isLink ? piece.label || piece.url : piece
              return (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-slate-400">·</span>}
                  {isLink ? (
                    <a href={withProtocol(piece.url)} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {text}
                    </a>
                  ) : piece === contact.email ? (
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {text}
                    </a>
                  ) : (
                    <span>{text}</span>
                  )}
                </span>
              )
            })}
          </p>
        )}
      </header>

      {summary && (
        <section>
          <CenteredHeading>Summary</CenteredHeading>
          <p className="text-[12.5px] leading-relaxed text-slate-700">{summary}</p>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <CenteredHeading>Education</CenteredHeading>
          {education.map((edu, i) => (
            <EntryRow
              key={i}
              left={edu.school}
              right={
                [edu.startDate, edu.endDate].filter(Boolean).length
                  ? `${edu.startDate || ''}${edu.startDate && edu.endDate ? ' – ' : ''}${edu.endDate || ''}`
                  : ''
              }
              subLeft={[edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')}
              subRight={edu.gpa && `GPA: ${edu.gpa}`}
            />
          ))}
        </section>
      )}

      {experience.length > 0 && (
        <section>
          <CenteredHeading>Experience</CenteredHeading>
          {experience.map((exp, i) => (
            <div key={i} className="mb-2.5">
              <EntryRow
                left={exp.role}
                right={
                  exp.startDate || exp.endDate || exp.current
                    ? `${exp.startDate || ''}${exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}${exp.current ? 'Present' : exp.endDate || ''}`
                    : ''
                }
                subLeft={exp.company}
                subRight={exp.location}
              />
              {exp.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc space-y-0.5 pl-5 text-[12px] leading-snug text-slate-700">
                  {exp.bullets.filter(Boolean).map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <CenteredHeading>Projects</CenteredHeading>
          {projects.map((proj, i) => {
            const links = [proj.liveLink, proj.githubLink].filter(Boolean).map(withProtocol)
            return (
              <div key={i} className="mb-2.5">
                <EntryRow left={proj.name} right={links.length > 0 ? links.join('  |  ') : ''} />
                {proj.description && <p className="text-[12px] leading-snug text-slate-700">{proj.description}</p>}
                {proj.bullets.filter(Boolean).length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-[12px] leading-snug text-slate-700">
                    {proj.bullets.filter(Boolean).map((b, bi) => (
                      <li key={bi}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <CenteredHeading>Skills</CenteredHeading>
          <p className="text-center text-[12.5px] leading-snug text-slate-700">{skills.join(' · ')}</p>
        </section>
      )}

      {customSections
        .filter((section) => section.title || section.bullets.filter(Boolean).length > 0)
        .map((section, i) => (
          <section key={i}>
            <CenteredHeading>{section.title || 'Additional'}</CenteredHeading>
            {section.bullets.filter(Boolean).length > 0 && (
              <ul className="list-disc space-y-0.5 pl-5 text-[12px] leading-snug text-slate-700">
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
