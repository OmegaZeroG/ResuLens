import { useCallback, useEffect, useState } from 'react'
import {
  listResumes,
  createResume,
  updateResume,
  uploadResumePhoto as uploadResumePhotoApi,
  removeResumePhoto as removeResumePhotoApi,
} from '../api/resumeApi'

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
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
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

  // Shared by both the Save button and photo upload (which needs a resume _id to
  // attach the photo to, and auto-saves first if the resume hasn't been saved yet).
  // Returns the normalized saved resume directly, since React state updates aren't
  // synchronous and callers may need the fresh _id immediately.
  const persist = useCallback(async () => {
    const payload = { title: resume.title, photoUrl: resume.photoUrl, sections: resume.sections }
    const saved = resume._id ? await updateResume(resume._id, payload) : await createResume(payload)
    const normalized = normalizeResume(saved)
    setResume(normalized)
    setLastSavedAt(new Date())
    return normalized
  }, [resume._id, resume.title, resume.photoUrl, resume.sections])

  const save = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      await persist()
    } catch (err) {
      setError(err.message)
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
    setContactField,
    setSummary,
    setSkills,
    education,
    experience,
    projects,
    save,
    uploadPhoto,
    removePhoto,
    resetForm,
  }
}
