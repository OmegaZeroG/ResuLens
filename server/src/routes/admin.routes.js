import { Router } from 'express'
import { listUsers, updateUserPlan } from '../controllers/admin.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

const router = Router()

// Every route below needs a valid logged-in user AND isAdmin === true.
router.use(requireAuth, requireAdmin)

router.get('/users', listUsers)
router.patch('/users/:id/plan', updateUserPlan)

export default router
