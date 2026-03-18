const pdfParse = require('pdf-parse')
const mammoth = require('mammoth')
const fs = require('fs')
const path = require('path')

/**
 * Parse a resume file (PDF or DOCX) and return plain text.
 * @param {string} filePath - absolute path to the file
 * @param {string} fileType - 'pdf' | 'docx'
 * @returns {Promise<string>} extracted text
 */
async function parseResume(filePath, fileType) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const ext = fileType || path.extname(filePath).toLowerCase().replace('.', '')

  if (ext === 'pdf') {
    const buffer = fs.readFileSync(filePath)
    const data = await pdfParse(buffer)
    return data.text.trim()
  }

  if (ext === 'docx' || ext === 'doc') {
    const result = await mammoth.extractRawText({ path: filePath })
    return result.value.trim()
  }

  throw new Error(`Unsupported file type: ${ext}`)
}

module.exports = { parseResume }
