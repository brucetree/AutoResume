const puppeteer = require('puppeteer')
const { uploadToS3 } = require('./s3Service')

/**
 * Convert resume content (HTML or markdown) to PDF, upload to S3.
 * @param {string} content - the resume in HTML or markdown format
 * @param {string} fileName - output file name (without extension)
 * @returns {Promise<string>} S3 key of the generated PDF
 */
async function generatePdf(content, fileName) {
  // If content contains HTML tags, use it directly; otherwise convert from markdown
  const isHtml = /<[a-z][\s\S]*>/i.test(content)
  const html = isHtml ? content : markdownToHtml(content)

  const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; margin: 40px; color: #222; line-height: 1.6; }
    h1 { font-size: 24px; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; }
    h2 { font-size: 18px; color: #4f46e5; margin-top: 20px; }
    h3 { font-size: 15px; margin-top: 12px; }
    ul { padding-left: 20px; }
    li { margin: 4px 0; }
    p { margin: 6px 0; }
    strong { font-weight: 600; }
    hr { border: none; border-top: 1px solid #ddd; margin: 16px 0; }
  </style>
</head>
<body>${html}</body>
</html>`

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  })

  const page = await browser.newPage()
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

  // Generate PDF as buffer (not saving to disk)
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  })

  await browser.close()

  // Upload PDF to S3
  const safeName = fileName.replace(/[^a-zA-Z0-9\u4e00-\u9fff-]/g, '_')
  const s3Key = `generated/${safeName}-${Date.now()}.pdf`
  await uploadToS3(pdfBuffer, s3Key, 'application/pdf')

  return s3Key
}

function markdownToHtml(md) {
  return md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<p|<hr)(.+)$/gm, '<p>$1</p>')
}

module.exports = { generatePdf }
