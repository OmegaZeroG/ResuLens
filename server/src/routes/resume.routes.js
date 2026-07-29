import { Router } from 'express'
import {
  createResume,
  listResumes,
  getResume,
  updateResume,
  deleteResume,
} from '../controllers/resume.controller.js'

const router = Router()

router.post('/', createResume)
router.get('/', listResumes)
router.get('/:id', getResume)
router.put('/:id', updateResume)
router.delete('/:id', deleteResume)

export default router
