import Resume from '../models/Resume.js'

function isValidObjectId(id) {
  return /^[a-f\d]{24}$/i.test(id)
}

export async function createResume(req, res) {
  try {
    const resume = await Resume.create(req.body)
    res.status(201).json(resume)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export async function listResumes(req, res) {
  try {
    // Once auth (Phase 2) lands, scope this to req.user.id instead of returning everything.
    const resumes = await Resume.find().sort({ updatedAt: -1 })
    res.json(resumes)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getResume(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid resume id' })
    }
    const resume = await Resume.findById(req.params.id)
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    res.json(resume)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateResume(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid resume id' })
    }
    const resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    res.json(resume)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export async function deleteResume(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid resume id' })
    }
    const resume = await Resume.findByIdAndDelete(req.params.id)
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    res.status(204).send()
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
