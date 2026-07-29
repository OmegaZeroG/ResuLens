import { Router } from 'express'
import { signup, login, getMe } from '../controllers/auth.controller.js'
import { googleRedirect, googleCallback, githubRedirect, githubCallback } from '../controllers/oauth.controller.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', requireAuth, getMe)

// Full-page redirects, not fetch() calls — the browser navigates to these
// directly, so there's no CORS involved. Google/GitHub redirect the browser
// back to the *Callback routes, which finish by redirecting to the client
// with either ?token=... or ?oauthError=... in the URL.
router.get('/google', googleRedirect)
router.get('/google/callback', googleCallback)
router.get('/github', githubRedirect)
router.get('/github/callback', githubCallback)

export default router
