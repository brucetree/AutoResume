require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const resumeRoutes = require('./routes/resumes')
const jobRoutes = require('./routes/jobs')
const applicationRoutes = require('./routes/applications')

const app = express()

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
  ],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/resumes', resumeRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/applications', applicationRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }))

module.exports = app
