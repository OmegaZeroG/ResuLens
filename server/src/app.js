import express from 'express'
import cors from 'cors'
import multer from 'multer'
import healthRouter from './routes/health.routes.js'
import resumeRouter from './routes/resume.routes.js'
import ApiError from './utils/ApiError.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/resume', resumeRouter)

// Auth and analyze routers get mounted here in later phases:
// app.use('/api/auth', authRouter)
// app.use('/api/analyze', analyzeRouter)

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
