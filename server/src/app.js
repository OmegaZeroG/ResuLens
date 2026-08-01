import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import multer from 'multer'
import healthRouter from './routes/health.routes.js'
import resumeRouter from './routes/resume.routes.js'
import authRouter from './routes/auth.routes.js'
import analyzeRouter from './routes/analyze.routes.js'
import adminRouter from './routes/admin.routes.js'
import ApiError from './utils/ApiError.js'

const app = express()

// Locked to known origins rather than left wide open, now that this is
// heading toward a real deploy. CLIENT_URL is the same env var
// oauth.controller.js already uses for where to redirect back to after
// login — one variable, one meaning ("where the frontend lives"). Localhost
// dev is always allowed too so `npm run dev` keeps working unchanged
// regardless of what CLIENT_URL is set to in this environment.
const allowedOrigins = [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173']

// By default, `cors` only lets browser JS read a small safelist of response
// headers (Content-Type, etc.) — custom headers are sent and visible in
// DevTools' Network tab either way, but invisible to `fetch()`'s `res.headers`
// unless explicitly exposed here. Needed so the client can actually read the
// X-RateLimit-* headers rateLimiter.js sets (see QuotaBadge.jsx) — without
// this, the badge silently gets null forever with no error anywhere.
app.use(
  cors({
    origin: [...new Set(allowedOrigins)],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-RateLimit-Tier', 'Retry-After'],
  }),
)
app.use(express.json())
// Only used for the short-lived OAuth CSRF state cookie (see oauth.controller.js) —
// nothing else in this app relies on cookies, sessions are still stateless JWT.
app.use(cookieParser())

app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/resume', resumeRouter)
app.use('/api/analyze', analyzeRouter)
app.use('/api/admin', adminRouter)

app.use((req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: 'Not found' })
})

// Global error handler — must be last, and must keep all 4 params so Express
// recognizes it as an error middleware. Anything thrown (ApiError or otherwise)
// in an asyncHandler-wrapped controller ends up here.
app.use((err, req, res, next) => {
  const isApiError = err instanceof ApiError
  const isMulterError = err instanceof multer.MulterError
  const statusCode = isApiError ? err.statusCode : isMulterError ? 400 : err.statusCode || 500
  const message = err.message || 'Internal server error'

  if (!isApiError && !isMulterError) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
})

export default app
