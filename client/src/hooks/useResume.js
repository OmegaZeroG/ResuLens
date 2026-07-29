import { useCallback, useEffect, useState } from 'react'
import { listResumes, createResume, updateResume } from '../api/resumeApi'

export const emptyResume = {
  _id: null,
  title: 'My Resume',
  photoUrl: '',
  sections: {
    contact: {
      fullName: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      portfolio: '',
    },
    summary: '',
    education: [],
    experience: [],
    skills: [],
    projects: [],
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
const emptyProject = { name: '', description: '', link: '', bullets: [] }

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
      contact: { ...emptyResume.sections.contact, ...(rawSections.contact || {}) },
      education: (rawSections.education || []).map((e) => ({ ...emptyEducation, ...e })),
      experience: (rawSections.experience || []).map((e) => ({ ...emptyExperience, ...e })),
      projects: (rawSections.projects || []).map((p) => ({ ...emptyProject, ...p })),
      skills: rawSections.skills || [],
    },
  }
}

export function useResume() {
  const [resume, setResume] = useState(emptyResume)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)

  // On first load, resume editing the most recently updated resume if one exists.
  useEffect(() => {
    let cancelled = false
    listResumes()
      .then((resumes) => {
        if (cancelled) return
        if (resumes && resumes.length > 0) {
          setResume(normalizeResume(resumes[0]))
        }
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
  }, [])

  const setTitle = useCallback((title) => {
    setResume((prev) => ({ ...prev, title }))
  }, [])

  const setContactField = useCallback((field, value) => {
    setResume((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        contact: { ...prev.sections.contact, [field]: value },
      },
    }))
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

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      const payload = { title: resume.title, photoUrl: resume.photoUrl, sections: resume.sections }
      const saved = resume._id ? await updateResume(resume._id, payload) : await createResume(payload)
      setResume(normalizeResume(saved))
      setLastSavedAt(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }, [resume._id, resume.title, resume.photoUrl, resume.sections])

  return {
    resume,
    loading,
    saving,
    error,
    lastSavedAt,
    setTitle,
    setContactField,
    setSummary,
    setSkills,
    education,
    experience,
    projects,
    save,
  }
}
