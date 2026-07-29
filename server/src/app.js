import express from 'express'
import cors from 'cors'
import healthRouter from './routes/health.routes.js'
import resumeRouter from './routes/resume.routes.js'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/health', healthRouter)
app.use('/api/resume', resumeRouter)

// Auth and analyze routers get mounted here in later phases:
// app.use('/api/auth', authRouter)
// app.use('/api/analyze', analyzeRouter)

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

export default app
