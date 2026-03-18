const express = require('express')
const cheerio = require('cheerio')
const authMiddleware = require('../middleware/authMiddleware')
const Resume = require('../models/Resume')
const Application = require('../models/Application')
const { analyzeAndModify } = require('../services/geminiService')

const router = express.Router()
router.use(authMiddleware)

/**
 * Fetch job description from URL if provided.
 */
async function fetchJobDescription(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    signal: AbortSignal.timeout(10000),
  })
  const html = await res.text()
  const $ = cheerio.load(html)
  // Remove scripts, styles, nav
  $('script, style, nav, header, footer').remove()
  return $('body').text().replace(/\s+/g, ' ').trim().slice(0, 8000)
}

// POST /api/jobs/analyze
// Body: { resumeId, jobDescription?, jobUrl?, company, position }
router.post('/analyze', async (req, res) => {
  const { resumeId, jobDescription, jobUrl, company, position } = req.body

  if (!resumeId || !company || !position) {
    return res.status(400).json({ message: 'resumeId, company, position 为必填项' })
  }
  if (!jobDescription && !jobUrl) {
    return res.status(400).json({ message: '请提供岗位描述或岗位 URL' })
  }

  try {
    const resume = await Resume.findOne({
      _id: resumeId,
      userId: req.user.sub || req.user.id,
    })
    if (!resume) return res.status(404).json({ message: '简历不存在' })
    if (!resume.parsedText) return res.status(400).json({ message: '简历文本为空，请重新上传' })

    let jobText = jobDescription
    if (!jobText && jobUrl) {
      jobText = await fetchJobDescription(jobUrl)
    }

    const { gapAnalysis, modifiedResume } = await analyzeAndModify(resume.parsedText, jobText)

    // Save modified resume as new version
    const modifiedResumeDoc = await Resume.create({
      userId: req.user.sub || req.user.id,
      originalFileUrl: resume.originalFileUrl,
      originalFileName: resume.originalFileName,
      fileType: resume.fileType,
      parsedText: resume.parsedText,
      modifiedContent: modifiedResume,
      version: resume.version + 1,
    })

    // Create application record
    const application = await Application.create({
      userId: req.user.sub || req.user.id,
      company,
      position,
      jobDescription: jobText,
      jobUrl: jobUrl || null,
      gapAnalysis,
      resumeId,
      modifiedResumeId: modifiedResumeDoc._id,
    })

    res.json({
      application,
      gapAnalysis,
      modifiedResumeId: modifiedResumeDoc._id,
      modifiedContent: modifiedResume,
    })
  } catch (err) {
    console.error('Analyze error:', err)
    res.status(500).json({ message: 'AI 分析失败', error: err.message })
  }
})

module.exports = router
