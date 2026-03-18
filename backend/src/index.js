require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')

const authRoutes = require('./routes/auth')
const resumeRoutes = require('./routes/resumes')
const jobRoutes = require('./routes/jobs')
const applicationRoutes = require('./routes/applications')

const app = express()

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3001',
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

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:password@localhost:27017/autoresume?authSource=admin'

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

const PORT = process.env.PORT || 5000
const server = app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`)
})

module.exports = { app, server }
