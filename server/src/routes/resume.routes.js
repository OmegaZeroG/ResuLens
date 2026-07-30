import { Router } from 'express'
import {
  createResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
  importResume,
  uploadResumePhoto,
  removeResumePhoto,
} from '../controllers/resume.controller.js'
import { uploadPhoto } from '../middleware/upload.js'
import { uploadImportFile } from '../middleware/uploadDocument.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.post('/', createResume)
router.get('/', listResumes)
router.post('/import', uploadImportFile, importResume)
router.get('/:id', getResume)
router.put('/:id', updateResume)
router.delete('/:id', deleteResume)
router.post('/:id/photo', uploadPhoto, uploadResumePhoto)
router.delete('/:id/photo', removeResumePhoto)

export default router
