import { forwardRef } from 'react'
import { MailIcon, PhoneIcon, MapPinIcon, GithubIcon, LinkIcon, detectLinkIcon } from '../common/icons'
import { withProtocol } from '../../utils/links'

// Bold uppercase label with a colored rule underneath — the classic resume
// "section divider" look. Used for every section so the eye can instantly
// tell where one ends and the next begins, instead of just relying on
// whitespace (which is easy to misread, especially once a section wraps).
function SectionHeading({ children }) {
  return (
    <h2 className="mb-2 border-b-[1.5px] border-indigo-600 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-700">
      {children}
    </h2>
  )
}

// One line of the contact block — an icon plus text, right-aligned, and a
// real link (mailto/tel/https) where that makes sense rather than plain text.
function ContactRow({ icon: Icon, text, href }) {
  if (!text) return null
  const content = (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <span>{text}</span>
    </span>
  )
  return (
    <div>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  )
}

// The row of profile links (LinkedIn, GitHub, LeetCode, Codeforces, anything
// custom) below the name — icon-only, no text, so an arbitrary number of
// links stay compact in one horizontal row instead of stacking into a wall
// of URLs.
function ProfileLinksRow({ links, indent }) {
  const items = (links || []).filter((l) => l.url)
  if (!items.length) return null
  return (
    <div className={`flex items-center gap-3 ${indent ? 'pl-20' : ''}`}>
      {items.map((link, i) => {
        const Icon = detectLinkIcon(link.label, link.url)
        return (
          <a
            key={i}
            href={withProtocol(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            title={link.label || link.url}
            className="text-slate-500 hover:text-indigo-600"
          >
            <Icon className="h-4 w-4" />
          </a>
        )
      })}
    </div>
  )
}

function ProjectLinks({ liveLink, githubLink }) {
  if (!liveLink && !githubLink) return null
  const links = [
    liveLink && { href: withProtocol(liveLink), label: 'Live Demo', icon: LinkIcon },
    githubLink && { href: withProtocol(githubLink), label: 'GitHub', icon: GithubIcon },
  ].filter(Boolean)

  return (
    <span className="shrink-0 whitespace-nowrap text-xs font-medium">
      {links.map(({ label, href, icon: Icon }, i) => (
        <span key={label}>
          {i > 0 && <span className="text-slate-400"> | </span>}
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
          >
            <Icon className="h-3 w-3" />
            {label}
          </a>
        </span>
      ))}
    </span>
  )
}

export const ResumePreview = forwardRef(function ResumePreview({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects, customSections } = resume.sections

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[8.5in] rounded-lg border border-slate-200 bg-white p-10 text-slate-800 shadow-sm"
    >
      {/* Left-aligned name block + right-aligned contact stack makes far
          better use of the page's full width than a centered header — a
          centered name/contact block over a wide page leaves the whole left
          and right margins empty for no reason. */}
      <header className="border-b-2 border-slate-800 pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            {resume.photoUrl && (
              // No photo → no badge at all, rather than an initials
              // placeholder standing in for a real photo.
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-indigo-100">
                <img src={resume.photoUrl} alt="Profile" className="h-full w-full object-cover object-center" />
              </div>
            )}
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-slate-900">
              {contact.fullName || 'Your Name'}
            </h1>
          </div>
          <div className="shrink-0 space-y-0.5 whitespace-nowrap text-right text-xs leading-relaxed text-slate-500">
            <ContactRow icon={PhoneIcon} text={contact.phone} href={contact.phone && `tel:${contact.phone.replace(/[^\d+]/g, '')}`} />
            <ContactRow icon={MailIcon} text={contact.email} href={contact.email && `mailto:${contact.email}`} />
            <ContactRow icon={MapPinIcon} text={contact.location} />
          </div>
        </div>
        {/* Profile links (LinkedIn, GitHub, LeetCode, Codeforces, anything
            custom) sit below the name as icon-only links, indented past the
            photo so they line up under the name text itself. */}
        <div className="mt-3">
          <ProfileLinksRow links={contact.links} indent={Boolean(resume.photoUrl)} />
        </div>
      </header>

      {summary && (
        <section className="mt-5">
          <SectionHeading>Professional Summary</SectionHeading>
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="mt-5">
          <SectionHeading>Skills</SectionHeading>
          {/* Two-column bulleted list uses the page width far better than one
              long dot-separated line, and reads faster as a scannable list. */}
          <ul className="columns-2 gap-x-8 text-sm text-slate-700">
            {skills.map((skill, i) => (
              <li key={i} className="mb-1 break-inside-avoid pl-3.5 -indent-3.5 leading-snug">
                <span className="mr-1.5 text-indigo-600">•</span>
                {skill}
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-5">
          <SectionHeading>Education</SectionHeading>
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
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-500">
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

      {experience.length > 0 && (
        <section className="mt-5">
          <SectionHeading>Experience</SectionHeading>
          <div className="space-y-3.5">
            {experience.map((exp, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span>
                    <span className="font-semibold text-slate-900">{exp.role}</span>
                    {exp.company && <span className="text-slate-600"> · {exp.company}</span>}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-xs font-medium text-slate-500">
                    {exp.startDate}
                    {exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}
                    {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.location && <div className="text-xs text-slate-500">{exp.location}</div>}
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
        <section className="mt-5">
          <SectionHeading>Projects</SectionHeading>
          <div className="space-y-3.5">
            {projects.map((proj, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-slate-900">{proj.name}</span>
                  <ProjectLinks liveLink={proj.liveLink} githubLink={proj.githubLink} />
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
            ))}
          </div>
        </section>
      )}

      {customSections
        .filter((section) => section.title || section.bullets.filter(Boolean).length > 0)
        .map((section, i) => (
          <section key={i} className="mt-5">
            <SectionHeading>{section.title || 'Additional Section'}</SectionHeading>
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
  )
})
