import { toFile } from '@imagekit/nodejs'
import Resume from '../models/Resume.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import isValidObjectId from '../utils/isValidObjectId.js'
import { getImageKitClient } from '../config/imagekit.js'

export const createResume = asyncHandler(async (req, res) => {
  const resume = await Resume.create(req.body)
  new ApiResponse(201, resume, 'Resume created').send(res)
})

export const listResumes = asyncHandler(async (req, res) => {
  // Once auth (Phase 2) lands, scope this to req.user.id instead of returning everything.
  const resumes = await Resume.find().sort({ updatedAt: -1 })
  new ApiResponse(200, resumes, 'Resumes fetched').send(res)
})

export const getResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findById(req.params.id)
  if (!resume) throw ApiError.notFound('Resume not found')
  new ApiResponse(200, resume, 'Resume fetched').send(res)
})

export const updateResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!resume) throw ApiError.notFound('Resume not found')
  new ApiResponse(200, resume, 'Resume updated').send(res)
})

export const deleteResume = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    throw ApiError.badRequest('Invalid resume id')
  }
  const resume = await Resume.findByIdAndDelete(req.params.id)
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

  const resume = await Resume.findById(req.params.id)
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

  const resume = await Resume.findById(req.params.id)
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
