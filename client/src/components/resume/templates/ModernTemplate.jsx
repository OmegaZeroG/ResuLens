import { forwardRef } from 'react'
import { MailIcon, PhoneIcon, MapPinIcon, InitialsIcon, detectLinkIcon, GithubIcon, LinkIcon } from '../../common/icons'
import { withProtocol } from '../../../utils/links'
import { getInitials } from '../../../utils/name'
import { getAvatarUrl } from '../../../utils/imagekitTransform'

// A solid-color header band (not a sidebar, not a plain rule) and pill-style
// skill badges are the two things that make this visually distinct from
// every other template — modeled on Rezi's "Modern" style: sans-serif,
// colored accent, still single-column and fully ATS-safe underneath.

function AccentHeading({ children }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-700">
      <span className="h-2 w-2 shrink-0 rounded-sm bg-indigo-500" />
      {children}
    </h2>
  )
}

function ContactPill({ icon: Icon, text, href }) {
  if (!text) return null
  const content = (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-100" />
      <span>{text}</span>
    </span>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white">
      {content}
    </a>
  ) : (
    content
  )
}

export const ModernTemplate = forwardRef(function ModernTemplate({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[8.5in] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <header className="bg-gradient-to-r from-indigo-600 to-violet-600 px-10 py-7 text-indigo-50">
        <div className="flex items-center gap-4">
          {resume.photoUrl && (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-white/70">
              <img src={getAvatarUrl(resume.photoUrl, { size: 128 })} alt="Profile" className="h-full w-full object-cover object-center" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-extrabold tracking-wide text-white">{contact.fullName || 'Your Name'}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <ContactPill icon={PhoneIcon} text={contact.phone} href={contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`} />
              <ContactPill icon={MailIcon} text={contact.email} href={contact.email && `mailto:${contact.email}`} />
              <ContactPill icon={MapPinIcon} text={contact.location} />
            </div>
          </div>
        </div>
        {(contact.links || []).filter((l) => l.url).length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {contact.links
              .filter((l) => l.url)
              .map((link, i) => {
                const isPortfolio = (link.label || '').trim().toLowerCase() === 'portfolio'
                const Icon = detectLinkIcon(link.label, link.url)
                return (
                  <a
                    key={i}
                    href={withProtocol(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs text-white hover:bg-white/25"
                  >
                    {isPortfolio ? (
                      <InitialsIcon initials={getInitials(contact.firstName, contact.lastName)} className="h-3.5 w-3.5" />
                    ) : (
                      <Icon className="h-3.5 w-3.5" />
                    )}
                    {link.label || link.url}
                  </a>
                )
              })}
          </div>
        )}
      </header>

      <div className="space-y-5 p-8">
        {summary && (
          <section>
            <AccentHeading>Summary</AccentHeading>
            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          </section>
        )}

        {skills.length > 0 && (
          <section>
            <AccentHeading>Skills</AccentHeading>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span key={i} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <AccentHeading>Experience</AccentHeading>
            <div className="space-y-3.5">
              {experience.map((exp, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-slate-900">{exp.role}</span>
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-indigo-500">
                      {exp.startDate}
                      {exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}
                      {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.company && (
                    <div className="text-xs text-slate-500">
                      {exp.company}
                      {exp.location ? ` · ${exp.location}` : ''}
                    </div>
                  )}
                  {exp.bullets.filter(Boolean).length > 0 && (
                    <ul className="mt-1 list-disc space-y-1 pl-5 leading-snug text-slate-700">
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

        {education.length > 0 && (
          <section>
            <AccentHeading>Education</AccentHeading>
            <div className="space-y-2">
              {education.map((edu, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="font-semibold text-slate-900">{edu.school}</span>
                      {(edu.degree || edu.fieldOfStudy) && (
                        <span className="text-slate-600">
                          {' '}
                          · {edu.degree}
                          {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-indigo-500">
                      {edu.startDate}
                      {edu.startDate && edu.endDate ? ' – ' : ''}
                      {edu.endDate}
                    </span>
                  </div>
                  {edu.gpa && <div className="text-xs text-slate-500">GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.length > 0 && (
          <section>
            <AccentHeading>Projects</AccentHeading>
            <div className="space-y-3.5">
              {projects.map((proj, i) => {
                const links = [
                  proj.liveLink && { href: withProtocol(proj.liveLink), label: 'Live Demo', icon: LinkIcon },
                  proj.githubLink && { href: withProtocol(proj.githubLink), label: 'GitHub', icon: GithubIcon },
                ].filter(Boolean)
                return (
                  <div key={i} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold text-slate-900">{proj.name}</span>
                      {links.length > 0 && (
                        <span className="shrink-0 whitespace-nowrap text-xs font-medium">
                          {links.map(({ label, href, icon: Icon }, li) => (
                            <span key={label}>
                              {li > 0 && <span className="text-slate-400"> | </span>}
                              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                                <Icon className="h-3 w-3" />
                                {label}
                              </a>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                    {proj.description && <p className="mt-0.5 text-slate-700">{proj.description}</p>}
                    {proj.bullets.filter(Boolean).length > 0 && (
                      <ul className="mt-1 list-disc space-y-1 pl-5 leading-snug text-slate-700">
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

        {customSections
          .filter((section) => section.title || section.bullets.filter(Boolean).length > 0)
          .map((section, i) => (
            <section key={i}>
              <AccentHeading>{section.title || 'Additional Section'}</AccentHeading>
              {section.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-snug text-slate-700">
                  {section.bullets.filter(Boolean).map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
      </div>
    </div>
  )
})
