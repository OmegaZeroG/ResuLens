import { forwardRef } from 'react'
import { MailIcon, PhoneIcon, MapPinIcon, InitialsIcon, detectLinkIcon } from '../../common/icons'
import { withProtocol } from '../../../utils/links'
import { getInitials } from '../../../utils/name'
import { getAvatarUrl } from '../../../utils/imagekitTransform'

// A genuinely different structure from the other templates, not just a
// re-skin: a dark sidebar (photo, contact, skills, education) alongside a
// white main column (summary, experience, projects). Dense and modern —
// good for scanning fast, and visually distinct from every other option so
// the picker actually offers a real choice.

function SidebarHeading({ children }) {
  return (
    <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-indigo-300">{children}</h2>
  )
}

function MainHeading({ children }) {
  return (
    <h2 className="mb-2 border-b-[1.5px] border-indigo-600 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-700">
      {children}
    </h2>
  )
}

function SidebarContactRow({ icon: Icon, text, href }) {
  if (!text) return null
  const content = (
    <span className="flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
      <span className="break-words">{text}</span>
    </span>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-300">
      {content}
    </a>
  ) : (
    content
  )
}

export const CompactTwoColumnTemplate = forwardRef(function CompactTwoColumnTemplate({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  return (
    <div
      ref={ref}
      className="mx-auto flex w-full max-w-[8.5in] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      <aside className="w-[34%] shrink-0 space-y-6 bg-slate-800 p-6 text-slate-200">
        <div className="text-center">
          {resume.photoUrl && (
            <div className="mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-indigo-400">
              <img
                src={getAvatarUrl(resume.photoUrl, { size: 160 })}
                alt="Profile"
                className="h-full w-full object-cover object-center"
              />
            </div>
          )}
          <h1 className="text-base font-bold leading-tight text-white">{contact.fullName || 'Your Name'}</h1>
        </div>

        <div>
          <SidebarHeading>Contact</SidebarHeading>
          <div className="space-y-1.5 text-[11px] leading-snug text-slate-300">
            <SidebarContactRow icon={PhoneIcon} text={contact.phone} href={contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`} />
            <SidebarContactRow icon={MailIcon} text={contact.email} href={contact.email && `mailto:${contact.email}`} />
            <SidebarContactRow icon={MapPinIcon} text={contact.location} />
            {(contact.links || [])
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
                    className="flex items-start gap-1.5 hover:text-indigo-300"
                  >
                    {isPortfolio ? (
                      <InitialsIcon initials={getInitials(contact.firstName, contact.lastName)} className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-300" />
                    )}
                    <span className="break-words">{link.label || link.url}</span>
                  </a>
                )
              })}
          </div>
        </div>

        {skills.length > 0 && (
          <div>
            <SidebarHeading>Skills</SidebarHeading>
            <ul className="space-y-1 text-[11px] leading-snug text-slate-300">
              {skills.map((skill, i) => (
                <li key={i}>{skill}</li>
              ))}
            </ul>
          </div>
        )}

        {education.length > 0 && (
          <div>
            <SidebarHeading>Education</SidebarHeading>
            <div className="space-y-2.5">
              {education.map((edu, i) => (
                <div key={i} className="text-[11px] leading-snug">
                  <p className="font-semibold text-white">{edu.school}</p>
                  {(edu.degree || edu.fieldOfStudy) && (
                    <p className="text-slate-300">
                      {edu.degree}
                      {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                    </p>
                  )}
                  <p className="text-slate-400">
                    {edu.startDate}
                    {edu.startDate && edu.endDate ? ' – ' : ''}
                    {edu.endDate}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="flex-1 space-y-5 p-8">
        {summary && (
          <section>
            <MainHeading>Summary</MainHeading>
            <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <MainHeading>Experience</MainHeading>
            <div className="space-y-3.5">
              {experience.map((exp, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold text-slate-900">{exp.role}</span>
                    <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-500">
                      {exp.startDate}
                      {exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}
                      {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  {exp.company && <div className="text-xs text-slate-500">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</div>}
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

        {projects.length > 0 && (
          <section>
            <MainHeading>Projects</MainHeading>
            <div className="space-y-3.5">
              {projects.map((proj, i) => (
                <div key={i} className="text-sm">
                  <span className="font-semibold text-slate-900">{proj.name}</span>
                  {proj.description && <p className="mt-0.5 text-slate-700">{proj.description}</p>}
                  {proj.bullets.filter(Boolean).length > 0 && (
                    <ul className="mt-1 list-disc space-y-1 pl-5 leading-snug text-slate-700">
                      {proj.bullets.filter(Boolean).map((b, bi) => (
                        <li key={bi}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {customSections
          .filter((section) => section.title || section.bullets.filter(Boolean).length > 0)
          .map((section, i) => (
            <section key={i}>
              <MainHeading>{section.title || 'Additional Section'}</MainHeading>
              {section.bullets.filter(Boolean).length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm leading-snug text-slate-700">
                  {section.bullets.filter(Boolean).map((b, bi) => (
                    <li key={bi}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
      </main>
    </div>
  )
})
