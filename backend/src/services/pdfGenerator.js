const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

const outputDir = path.join(__dirname, '../../uploads/generated')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

/**
 * Convert markdown resume content to a downloadable PDF.
 * @param {string} markdownContent - the resume in markdown format
 * @param {string} fileName - output file name (without extension)
 * @returns {Promise<string>} absolute path to the generated PDF
 */
async function generatePdf(markdownContent, fileName) {
  // Simple markdown-to-HTML conversion for key elements
  const html = markdownToHtml(markdownContent)

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
  })

  const page = await browser.newPage()
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' })

  const outputPath = path.join(outputDir, `${fileName}-${Date.now()}.pdf`)
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    printBackground: true,
  })

  await browser.close()
  return outputPath
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
