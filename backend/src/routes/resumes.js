const express = require('express')
const path = require('path')
const fs = require('fs')
const authMiddleware = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const Resume = require('../models/Resume')
const { parseResume } = require('../services/resumeParser')

const router = express.Router()
router.use(authMiddleware)

// POST /api/resumes — upload and parse a resume file
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' })
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
  const fileType = ext === 'pdf' ? 'pdf' : 'docx'

  try {
    const parsedText = await parseResume(req.file.path, fileType)

    // Check if user has any resumes — first one becomes primary
    const userId = req.user.sub || req.user.id
    const existingCount = await Resume.countDocuments({ userId })

    const resume = await Resume.create({
      userId,
      originalFileUrl: req.file.path,
      originalFileName: req.file.originalname,
      fileType,
      fileSize: req.file.size,
      parsedText,
      isPrimary: existingCount === 0, // first resume is primary
    })

    res.status(201).json({ resume })
  } catch (err) {
    console.error('Resume upload error:', err)
    res.status(500).json({ message: 'File parsing failed', error: err.message })
  }
})

// GET /api/resumes — list user's resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.sub || req.user.id })
      .sort({ isPrimary: -1, createdAt: -1 })
      .select('-parsedText')
    res.json({ resumes })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/resumes/:id — get single resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PUT /api/resumes/:id — update modified content (after user edits)
router.put('/:id', async (req, res) => {
  const { modifiedContent } = req.body
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub || req.user.id },
      { modifiedContent },
      { new: true }
    )
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/resumes/:id/rename — rename a resume file
router.patch('/:id/rename', async (req, res) => {
  const { fileName } = req.body
  if (!fileName || !fileName.trim()) {
    return res.status(400).json({ message: 'File name is required' })
  }
  try {
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub || req.user.id },
      { originalFileName: fileName.trim() },
      { new: true }
    ).select('-parsedText')
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/resumes/:id/primary — set a resume as primary
router.patch('/:id/primary', async (req, res) => {
  const userId = req.user.sub || req.user.id
  try {
    // Unset current primary
    await Resume.updateMany({ userId }, { isPrimary: false })
    // Set new primary
    const resume = await Resume.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isPrimary: true },
      { new: true }
    ).select('-parsedText')
    if (!resume) return res.status(404).json({ message: 'Resume not found' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: 'Server error' })
  }
})

// GET /api/resumes/:id/download — download original resume file
router.get('/:id/download', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    const filePath = path.resolve(resume.originalFileUrl)
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' })
    }

    const fileName = resume.originalFileName || `resume.${resume.fileType}`
    res.download(filePath, fileName)
  } catch (err) {
    console.error('Resume download error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/resumes/:id — delete a resume
router.delete('/:id', async (req, res) => {
  const userId = req.user.sub || req.user.id
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId })
    if (!resume) return res.status(404).json({ message: 'Resume not found' })

    // Delete the file from disk
    const filePath = path.resolve(resume.originalFileUrl)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    const wasPrimary = resume.isPrimary
    await Resume.deleteOne({ _id: req.params.id })

    // If deleted resume was primary, promote the most recent one
    if (wasPrimary) {
      const next = await Resume.findOne({ userId }).sort({ createdAt: -1 })
      if (next) {
        next.isPrimary = true
        await next.save()
      }
    }

    res.json({ message: 'Resume deleted successfully' })
  } catch (err) {
    console.error('Resume delete error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
