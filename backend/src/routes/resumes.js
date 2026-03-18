const express = require('express')
const path = require('path')
const authMiddleware = require('../middleware/authMiddleware')
const upload = require('../middleware/upload')
const Resume = require('../models/Resume')
const { parseResume } = require('../services/resumeParser')

const router = express.Router()
router.use(authMiddleware)

// POST /api/resumes — upload and parse a resume file
router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请上传文件' })
  }

  const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '')
  const fileType = ext === 'pdf' ? 'pdf' : 'docx'

  try {
    const parsedText = await parseResume(req.file.path, fileType)

    const resume = await Resume.create({
      userId: req.user.sub || req.user.id,
      originalFileUrl: req.file.path,
      originalFileName: req.file.originalname,
      fileType,
      parsedText,
    })

    res.status(201).json({ resume })
  } catch (err) {
    console.error('Resume upload error:', err)
    res.status(500).json({ message: '文件解析失败', error: err.message })
  }
})

// GET /api/resumes — list user's resumes
router.get('/', async (req, res) => {
  try {
    const resumes = await Resume.find({ userId: req.user.sub || req.user.id })
      .sort({ createdAt: -1 })
      .select('-parsedText')
    res.json({ resumes })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// GET /api/resumes/:id — get single resume
router.get('/:id', async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    })
    if (!resume) return res.status(404).json({ message: '简历不存在' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
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
    if (!resume) return res.status(404).json({ message: '简历不存在' })
    res.json({ resume })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

module.exports = router
