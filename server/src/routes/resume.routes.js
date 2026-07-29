import { Router } from 'express'
import {
  createResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  uploadResumePhoto,
  removeResumePhoto,
} from '../controllers/resume.controller.js'
import { uploadPhoto } from '../middleware/upload.js'

const router = Router()

router.post('/', createResume)
router.get('/', listResumes)
router.get('/:id', getResume)
router.put('/:id', updateResume)
router.delete('/:id', deleteResume)
router.post('/:id/photo', uploadPhoto, uploadResumePhoto)
router.delete('/:id/photo', removeResumePhoto)

export default router
