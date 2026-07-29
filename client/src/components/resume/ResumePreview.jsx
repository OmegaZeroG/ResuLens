import { forwardRef } from 'react'

export const ResumePreview = forwardRef(function ResumePreview({ resume }, ref) {
  const { contact, summary, education, experience, skills, projects } = resume.sections

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-[8.5in] rounded-lg border border-slate-200 bg-white p-10 text-slate-800 shadow-sm"
    >
      <header className="flex flex-col items-center border-b border-slate-200 pb-4 text-center">
        {resume.photoUrl && (
          <img
            src={resume.photoUrl}
            alt="Profile"
            className="mb-3 h-20 w-20 rounded-full object-cover"
          />
        )}
        <h1 className="text-2xl font-bold tracking-tight">{contact.fullName || 'Your Name'}</h1>
        <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-xs text-slate-500">
          {[contact.email, contact.phone, contact.location, contact.linkedin, contact.portfolio]
            .filter(Boolean)
            .map((item, i) => (
              <span key={i}>{item}</span>
            ))}
        </p>
      </header>

      {summary && (
        <section className="mt-4">
          <p className="text-sm leading-relaxed text-slate-700">{summary}</p>
        </section>
      )}

      {education.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Education</h2>
          <div className="space-y-2">
            {education.map((edu, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between font-medium">
                  <span>
                    {edu.school}
                    {edu.degree && ` — ${edu.degree}`}
                    {edu.fieldOfStudy && ` in ${edu.fieldOfStudy}`}
                  </span>
                  <span className="text-slate-500">
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
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Experience</h2>
          <div className="space-y-3">
            {experience.map((exp, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between font-medium">
                  <span>
                    {exp.role}
                    {exp.company && ` — ${exp.company}`}
                  </span>
                  <span className="text-slate-500">
                    {exp.startDate}
                    {exp.startDate && (exp.endDate || exp.current) ? ' – ' : ''}
                    {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                {exp.location && <div className="text-xs text-slate-500">{exp.location}</div>}
                {exp.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
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
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Projects</h2>
          <div className="space-y-3">
            {projects.map((proj, i) => (
              <div key={i} className="text-sm">
                <div className="flex justify-between font-medium">
                  <span>{proj.name}</span>
                  {proj.link && <span className="text-xs font-normal text-slate-500">{proj.link}</span>}
                </div>
                {proj.description && <p className="text-slate-700">{proj.description}</p>}
                {proj.bullets.filter(Boolean).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-700">
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

      {skills.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Skills</h2>
          <p className="text-sm text-slate-700">{skills.join(' • ')}</p>
        </section>
      )}
    </div>
  )
})
