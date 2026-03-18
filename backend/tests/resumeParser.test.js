const path = require('path')
const fs = require('fs')
const { parseResume } = require('../src/services/resumeParser')

describe('parseResume', () => {
  it('throws if file does not exist', async () => {
    await expect(parseResume('/nonexistent/file.pdf', 'pdf')).rejects.toThrow('File not found')
  })

  it('throws for unsupported file types', async () => {
    // Create a temp file
    const tmpPath = path.join(__dirname, 'tmp_test.txt')
    fs.writeFileSync(tmpPath, 'hello')
    try {
      await expect(parseResume(tmpPath, 'txt')).rejects.toThrow('Unsupported file type')
    } finally {
      fs.unlinkSync(tmpPath)
    }
  })
})
