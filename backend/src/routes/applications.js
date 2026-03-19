const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const Application = require('../models/Application')
const Resume = require('../models/Resume')
const { generatePdf } = require('../services/pdfGenerator')
const { getPresignedUrl } = require('../services/s3Service')

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
    res.status(500).json({ message: '服务器错误' })
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
    if (!app) return res.status(404).json({ message: '记录不存在' })
    res.json({ application: app })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// PATCH /api/applications/:id/status — update application status
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body
  const validStatuses = ['analyzing', 'editing', 'applied', 'interview', 'rejected', 'offer']
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: '无效的状态值' })
  }
  try {
    const app = await Application.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.sub || req.user.id },
      { status },
      { new: true }
    )
    if (!app) return res.status(404).json({ message: '记录不存在' })
    res.json({ application: app })
  } catch (err) {
    res.status(500).json({ message: '服务器错误' })
  }
})

// POST /api/applications/:id/export-pdf — generate PDF and return download URL
router.post('/:id/export-pdf', async (req, res) => {
  try {
    const app = await Application.findOne({
      _id: req.params.id,
      userId: req.user.sub || req.user.id,
    }).populate('modifiedResumeId')

    if (!app) return res.status(404).json({ message: '记录不存在' })
    if (!app.modifiedResumeId?.modifiedContent) {
      return res.status(400).json({ message: '没有修改后的简历内容' })
    }

    const s3Key = await generatePdf(
      app.modifiedResumeId.modifiedContent,
      `${app.company}-${app.position}`
    )

    // Return a presigned download URL (valid for 1 hour)
    const downloadUrl = await getPresignedUrl(s3Key)

    res.json({
      message: 'PDF 生成成功',
      downloadUrl,
      s3Key,
    })
  } catch (err) {
    console.error('PDF export error:', err)
    res.status(500).json({ message: 'PDF 生成失败', error: err.message })
  }
})

module.exports = router
