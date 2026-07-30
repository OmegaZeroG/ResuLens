import { Router } from 'express'
import { analyze, improve, scoreAts, listAnalyses, getAnalysis, getUsageStats } from '../controllers/analyze.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { uploadAnalyzeFiles } from '../middleware/uploadDocument.js'
import { rateLimit } from '../middleware/rateLimiter.js'

const router = Router()

router.use(requireAuth)

// Rate-limited before the (potentially large) file upload is even parsed —
// a request over quota gets rejected immediately instead of after paying
// the cost of handling its multipart body. `improve` costs more than a
// plain `analyze` since it's a full resume rewrite, not just a score.
router.post('/', rateLimit({ cost: 1, route: 'analyze' }), uploadAnalyzeFiles, analyze)
router.post('/improve', rateLimit({ cost: 2, route: 'improve' }), uploadAnalyzeFiles, improve)
// Independent ATS score (no JD required) — shares the same hourly AI quota
// bucket as analyze/improve rather than getting its own separate limit, so
// there's one coherent "AI requests" budget per user, not several to reason
// about. Before '/:id' for the same routing-order reason as usage/stats.
router.post('/ats-score', rateLimit({ cost: 1, route: 'ats-score' }), uploadAnalyzeFiles, scoreAts)
router.get('/', listAnalyses)
// Before '/:id' — otherwise Express would try to match "usage" as an :id.
router.get('/usage/stats', getUsageStats)
router.get('/:id', getAnalysis)

export default router
