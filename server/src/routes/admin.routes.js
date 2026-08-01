import { Router } from 'express'
import {
  listUsers,
  getStats,
  getUserDetail,
  updateUserPlan,
  resetUserRateLimit,
  setUserActive,
  deleteUser,
} from '../controllers/admin.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Every route below needs a valid logged-in user AND isAdmin === true.
router.use(requireAuth, requireAdmin)

router.get('/stats', getStats)
router.get('/users', listUsers)
router.get('/users/:id', getUserDetail)
router.patch('/users/:id/plan', updateUserPlan)
router.patch('/users/:id/active', setUserActive)
router.post('/users/:id/reset-limit', resetUserRateLimit)
router.delete('/users/:id', deleteUser)

export default router
