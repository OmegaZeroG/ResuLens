import { toFile } from '@imagekit/nodejs'
import Resume from '../models/Resume.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import isValidObjectId from '../utils/isValidObjectId.js'
import { getImageKitClient } from '../config/imagekit.js'

// Every handler here runs behind requireAuth (see resume.routes.js), so req.user
// is always set. All queries are scoped to req.user._id — a resume that exists
// but belongs to someone else looks identical to one that doesn't exist (404,
// not 403), so we don't leak which resume IDs are real to non-owners.

export const createResume = asyncHandler(async (req, res) => {
  const { title, photoUrl, sections } = req.body
  const resume = await Resume.create({ title, photoUrl, sections, userId: req.user._id })
  new ApiResponse(201, resume, 'Resume created').send(res)
})

export const listResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort({ updatedAt: -1 })
  new ApiResponse(200, resumes, 'Resumes fetched').send(res)
})

export const getResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) throw ApiError.notFound('Resume not found')
  new ApiResponse(200, resume, 'Resume fetched').send(res)
})

export const updateResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  // Only these fields are ever writable via this endpoint — never trust the body
  // for userId/photoFileId, both of which are server-controlled.
  const { title, photoUrl, sections } = req.body
  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { title, photoUrl, sections },
    { new: true, runValidators: true },
  )
  if (!resume) throw ApiError.notFound('Resume not found')
  new ApiResponse(200, resume, 'Resume updated').send(res)
})

export const deleteResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!resume) throw ApiError.notFound('Resume not found')
  new ApiResponse(200, null, 'Resume deleted').send(res)
})

export const uploadResumePhoto = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  if (!req.file) {
    throw ApiError.badRequest('No photo file uploaded (expected form field "photo")')
  }

  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) throw ApiError.notFound('Resume not found')

  const imagekit = getImageKitClient()

  // Replacing an existing photo — clean up the old file so it doesn't sit around
  // in ImageKit forever. Best-effort: if this fails, still proceed with the new
  // upload rather than blocking the user over an orphaned old file.
  if (resume.photoFileId) {
    try {
      await imagekit.files.delete(resume.photoFileId)
    } catch (err) {
      console.error('Failed to delete previous photo from ImageKit:', err.message)
    }
  }

  const uploaded = await imagekit.files.upload({
    file: await toFile(req.file.buffer, req.file.originalname),
    fileName: `resume-${resume._id}-${Date.now()}`,
    folder: '/resulens/photos',
    useUniqueFileName: false,
  })

  resume.photoUrl = uploaded.url
  resume.photoFileId = uploaded.fileId
  await resume.save()

  new ApiResponse(200, resume, 'Photo uploaded').send(res)
})

export const removeResumePhoto = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }

  const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
  if (!resume) throw ApiError.notFound('Resume not found')

  if (resume.photoFileId) {
    try {
      const imagekit = getImageKitClient()
      await imagekit.files.delete(resume.photoFileId)
    } catch (err) {
      console.error('Failed to delete photo from ImageKit:', err.message)
    }
  }

  resume.photoUrl = ''
  resume.photoFileId = ''
  await resume.save()

  new ApiResponse(200, resume, 'Photo removed').send(res)
})
