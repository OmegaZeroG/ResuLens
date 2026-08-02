import { useCallback, useEffect, useState } from 'react'
import {
  getResume,
  createResume,
  updateResume,
  uploadResumePhoto as uploadResumePhotoApi,
  removeResumePhoto as removeResumePhotoApi,
} from '../api/resumeApi'

export const emptyResume = {
  _id: null,
  title: 'My Resume',
  template: 'default',
  photoUrl: '',
  sections: {
    contact: {
      firstName: '',
      middleName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
      links: [],
    },
    summary: '',
    education: [],
    experience: [],
    skills: [],
    projects: [],
    customSections: [],
  },
}

const emptyEducation = { school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gpa: '' }
const emptyExperience = {
  company: '',
  role: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [],
}
const emptyProject = { name: '', description: '', liveLink: '', githubLink: '', bullets: [] }
const emptyCustomSection = { title: '', bullets: [] }
const emptyContactLink = { label: '', url: '' }

// Older resumes had fixed `linkedin`/`portfolio` fields instead of the
// flexible `links` list — fold them in as real link entries instead of
// losing them. Only runs when `links` is still empty (a resume that predates
// this feature); once it has real entries, this never re-runs, so it can't
// duplicate them on every load.
function migrateContactLinks(contact) {
  if (contact.links?.length) return contact.links
  const migrated = []
  if (contact.linkedin) migrated.push({ label: 'LinkedIn', url: contact.linkedin })
  if (contact.portfolio) migrated.push({ label: 'GitHub', url: contact.portfolio })
  return migrated
}

// Older resumes only had a single `fullName` field before it was split into
// First/Middle/Last (needed so initials can reliably use first + last only,
// never the middle name). Best-effort split by whitespace — first word is
// the first name, last word is the last name, anything in between is the
// middle name.
function splitFullName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { firstName: '', middleName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' }
  return { firstName: parts[0], lastName: parts[parts.length - 1], middleName: parts.slice(1, -1).join(' ') }
}

// The single source of truth for the display name — always recomputed from
// the three parts so every consumer that just wants "the name as one string"
// (the preview header, the PDF export, the AI prompts) keeps working
// unchanged without needing to know about the split.
function computeFullName(contact) {
  return [contact.firstName, contact.middleName, contact.lastName].filter(Boolean).join(' ')
}

// The API may return documents saved before a field existed, or created with a partial
// payload (e.g. a quick curl test). Never trust the shape blindly — deep-merge onto the
// known-good empty shape so every section always has every field the form expects.
function normalizeResume(raw) {
  const rawSections = raw?.sections || {}
  return {
    ...emptyResume,
    ...raw,
    sections: {
      ...emptyResume.sections,
      ...rawSections,
      contact: (() => {
        const contact = { ...emptyResume.sections.contact, ...(rawSections.contact || {}) }
        contact.links = migrateContactLinks(contact).map((l) => ({ ...emptyContactLink, ...l }))
        // Only split if the parts genuinely aren't there yet — never
        // overwrite real per-part data once it exists.
        if (!contact.firstName && !contact.lastName && contact.fullName) {
          Object.assign(contact, splitFullName(contact.fullName))
        }
        return contact
      })(),
      education: (rawSections.education || []).map((e) => ({ ...emptyEducation, ...e })),
      experience: (rawSections.experience || []).map((e) => ({ ...emptyExperience, ...e })),
      projects: (rawSections.projects || []).map((p) => {
        const merged = { ...emptyProject, ...p }
        // Older resumes only had a single `link` field before Live/GitHub
        // were split apart — in practice that field was always used for the
        // GitHub repo URL, so carry it over instead of silently losing it.
        if (p?.link && !merged.githubLink) merged.githubLink = p.link
        delete merged.link
        return merged
      }),
      skills: rawSections.skills || [],
      customSections: (rawSections.customSections || []).map((s) => ({ ...emptyCustomSection, ...s })),
    },
  }
}

// resumeId: an existing resume's _id to load and edit, or null/undefined to
// start a blank draft (the "New Resume" flow from the dashboard).
export function useResume(resumeId) {
  const [resume, setResume] = useState(emptyResume)
  const [loading, setLoading] = useState(Boolean(resumeId))
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  // Loads the specific resume the dashboard asked for. No resumeId means a
  // brand new draft — nothing to fetch, just reset to blank.
  useEffect(() => {
    if (!resumeId) {
      setResume(JSON.parse(JSON.stringify(emptyResume)))
      setLoading(false)
      setError(null)
      setLastSavedAt(null)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getResume(resumeId)
      .then((data) => {
        if (!cancelled) setResume(normalizeResume(data))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resumeId])

  const setTitle = useCallback((title) => {
    setResume((prev) => ({ ...prev, title }))
  }, [])

  const setTemplate = useCallback((template) => {
    setResume((prev) => ({ ...prev, template }))
  }, [])

  const setContactField = useCallback((field, value) => {
    setResume((prev) => {
      const contact = { ...prev.sections.contact, [field]: value }
      // fullName is never edited directly anymore (the form has separate
      // First/Middle/Last inputs) — keep it in sync automatically so every
      // place that just wants a display string still works unchanged.
      if (field === 'firstName' || field === 'middleName' || field === 'lastName') {
        contact.fullName = computeFullName(contact)
      }
      return { ...prev, sections: { ...prev.sections, contact } }
    })
  }, [])

  // Contact links are a nested array (sections.contact.links), one level
  // deeper than the top-level arrays makeListHelpers below handles, so they
  // get their own small set of helpers instead.
  const addContactLink = useCallback(() => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        contact: { ...prev.sections.contact, links: [...prev.sections.contact.links, { ...emptyContactLink }] },
      },
    }))
  }, [])

  const updateContactLink = useCallback((index, field, value) => {
    setResume((prev) => {
      const links = [...prev.sections.contact.links]
      links[index] = { ...links[index], [field]: value }
      return { ...prev, sections: { ...prev.sections, contact: { ...prev.sections.contact, links } } }
    })
  }, [])

  const removeContactLink = useCallback((index) => {
    setResume((prev) => {
      const links = prev.sections.contact.links.filter((_, i) => i !== index)
      return { ...prev, sections: { ...prev.sections, contact: { ...prev.sections.contact, links } } }
    })
  }, [])

  const setSummary = useCallback((summary) => {
    setResume((prev) => ({ ...prev, sections: { ...prev.sections, summary } }))
  }, [])

  const setSkills = useCallback((skillsText) => {
    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    setResume((prev) => ({ ...prev, sections: { ...prev.sections, skills } }))
  }, [])

  function makeListHelpers(key, blank) {
    const add = () => {
      setResume((prev) => ({
        ...prev,
        sections: { ...prev.sections, [key]: [...prev.sections[key], { ...blank }] },
      }))
    }
    const update = (index, field, value) => {
      setResume((prev) => {
        const list = [...prev.sections[key]]
        list[index] = { ...list[index], [field]: value }
        return { ...prev, sections: { ...prev.sections, [key]: list } }
      })
    }
    const remove = (index) => {
      setResume((prev) => {
        const list = prev.sections[key].filter((_, i) => i !== index)
        return { ...prev, sections: { ...prev.sections, [key]: list } }
      })
    }
    return { add, update, remove }
  }

  const education = makeListHelpers('education', emptyEducation)
  const experience = makeListHelpers('experience', emptyExperience)
  const projects = makeListHelpers('projects', emptyProject)
  const customSections = makeListHelpers('customSections', emptyCustomSection)

  // Shared by both the Save button and photo upload (which needs a resume _id to
  // attach the photo to, and auto-saves first if the resume hasn't been saved yet).
  // Returns the normalized saved resume directly, since React state updates aren't
  // synchronous and callers may need the fresh _id immediately.
  const persist = useCallback(async () => {
    const payload = { title: resume.title, template: resume.template, photoUrl: resume.photoUrl, sections: resume.sections }
    const saved = resume._id ? await updateResume(resume._id, payload) : await createResume(payload)
    const normalized = normalizeResume(saved)
    setResume(normalized)
    setLastSavedAt(new Date())
    return normalized
  }, [resume._id, resume.title, resume.photoUrl, resume.sections])

  // Returns a plain boolean (rather than throwing) so callers — right now
  // just the Save button — can react to success/failure (e.g. a toast)
  // without needing to also duplicate the error-message extraction this
  // hook already does via the `error` state.
  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      await persist()
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setSaving(false)
    }
  }, [persist])

  const uploadPhoto = useCallback(
    async (file) => {
      setUploadingPhoto(true)
      setError(null)
      try {
        let id = resume._id
        if (!id) {
          const saved = await persist()
          id = saved._id
        }
        const updated = await uploadResumePhotoApi(id, file)
        setResume(normalizeResume(updated))
        setLastSavedAt(new Date())
      } catch (err) {
        setError(err.message)
      } finally {
        setUploadingPhoto(false)
      }
    },
    [resume._id, persist],
  )

  // Clears the form back to a blank draft, including dropping the current _id —
  // so this never touches what's already saved. If you never click Save after
  // resetting, refreshing the page brings your saved resume right back. If you
  // do Save, it creates a new resume rather than overwriting the old one.
  const resetForm = useCallback(() => {
    setResume(JSON.parse(JSON.stringify(emptyResume)))
    setError(null)
    setLastSavedAt(null)
  }, [])

  const removePhoto = useCallback(async () => {
    if (!resume._id) {
      // Never saved, so there's nothing on the server to remove — just clear locally.
      setResume((prev) => ({ ...prev, photoUrl: '', photoFileId: '' }))
      return
    }
    setUploadingPhoto(true)
    setError(null)
    try {
      const updated = await removeResumePhotoApi(resume._id)
      setResume(normalizeResume(updated))
      setLastSavedAt(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }, [resume._id])

  return {
    resume,
    loading,
    saving,
    uploadingPhoto,
    error,
    lastSavedAt,
    setTitle,
    setTemplate,
    setContactField,
    addContactLink,
    updateContactLink,
    removeContactLink,
    setSummary,
    setSkills,
    education,
    experience,
    projects,
    customSections,
    save,
    uploadPhoto,
    removePhoto,
    resetForm,
  }
}
