const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const Application = require('../models/Application')
const Resume = require('../models/Resume')
const { generatePdf } = require('../services/pdfGenerator')
const path = require('path')
const fs = require('fs')

const router = express.Router()
router.use(authMiddleware)

// GET /api/applications — list all applications for user
router.get('/', async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user.sub || req.user.id })
      .sort({ createdAt: -1 })
      .populate('resumeId', 'originalFileName')
      .populate('modifiedResumeId', 'modifiedContent')
    res.json({ applications })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/applications/:id
router.get('/:id', async (req, res) => {
  try {
    const app = await Application.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    })
      .populate('resumeId')
      .populate('modifiedResumeId')
    if (!app) return res.status(404).json({ message: 'Record not found' })
    res.json({ application: app })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/applications/:id/status — update application status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['analyzing', 'editing', 'applied', 'interview', 'rejected', 'offer']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' })
  }
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub || req.user.id },
      { status },
      { new: true }
    )
    if (!app) return res.status(404).json({ message: 'Record not found' })
    res.json({ application: app })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// POST /api/applications/:id/export-pdf — generate and download PDF
router.post('/:id/export-pdf', async (req, res) => {
  try {
    const app = await Application.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    }).populate('modifiedResumeId')

    if (!app) return res.status(404).json({ message: 'Record not found' })
    if (!app.modifiedResumeId?.modifiedContent) {
      return res.status(400).json({ message: 'No modified resume content found' })
    }

    const pdfPath = await generatePdf(
      app.modifiedResumeId.modifiedContent,
      `${app.company}-${app.position}`
    )

    res.download(pdfPath, path.basename(pdfPath), (err) => {
      if (!err) {
        // Optionally clean up after download
        setTimeout(() => {
          try { fs.unlinkSync(pdfPath) } catch { /* ignore */ }
        }, 5000)
      }
    })
  } catch (err) {
    console.error('PDF export error:', err)
    res.status(500).json({ message: 'PDF generation failed', error: err.message })
  }
})

// DELETE /api/applications/:id — delete an application
router.delete('/:id', async (req, res) => {
  const userId = req.user.sub || req.user.id
  try {
    const app = await Application.findOne({ _id: req.params.id, userId })
    if (!app) return res.status(404).json({ message: 'Record not found' })
    await Application.deleteOne({ _id: req.params.id })
    res.json({ message: 'Application deleted successfully' })
  } catch (err) {
    console.error('Application delete error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
