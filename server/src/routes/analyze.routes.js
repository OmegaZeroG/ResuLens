import { Router } from 'express'
import { analyze, improve, listAnalyses, getAnalysis } from '../controllers/analyze.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadAnalyzeFiles } from '../middleware/uploadDocument.js'

const router = Router()

router.use(requireAuth)

router.post('/', uploadAnalyzeFiles, analyze)
router.post('/improve', uploadAnalyzeFiles, improve)
router.get('/', listAnalyses)
router.get('/:id', getAnalysis)

export default router
