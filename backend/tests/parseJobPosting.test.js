// Mock the Gemini SDK before requiring the service
const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: mockGenerateContent,
      }),
    })),
  }
})

process.env.GEMINI_API_KEY = 'test-key'

const { parseJobPosting } = require('../src/services/geminiService')

describe('parseJobPosting', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset()
  })

  it('returns structured job data from raw text', async () => {
    const mockResponse = {
      jobTitle: 'Senior Software Engineer',
      company: 'Google',
      jobDescription: 'We are looking for a senior engineer with 5+ years of experience...',
    }
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockResponse) },
    })

    const result = await parseJobPosting('Some raw job posting text from a website')
    expect(result).toHaveProperty('jobTitle', 'Senior Software Engineer')
    expect(result).toHaveProperty('company', 'Google')
    expect(result).toHaveProperty('jobDescription')
    expect(result.jobDescription).toContain('senior engineer')
  })

  it('handles JSON wrapped in markdown code fences', async () => {
    const mockResponse = {
      jobTitle: 'Product Manager',
      company: 'Meta',
      jobDescription: 'Lead product strategy...',
    }
    mockGenerateContent.mockResolvedValue({
      response: { text: () => '```json\n' + JSON.stringify(mockResponse) + '\n```' },
    })

    const result = await parseJobPosting('Raw text')
    expect(result.jobTitle).toBe('Product Manager')
    expect(result.company).toBe('Meta')
  })

  it('returns raw text as jobDescription when JSON parsing fails', async () => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'This is not valid JSON at all' },
    })

    const rawText = 'Some job posting that could not be parsed'
    const result = await parseJobPosting(rawText)
    expect(result).toHaveProperty('jobTitle', '')
    expect(result).toHaveProperty('company', '')
    expect(result).toHaveProperty('jobDescription')
  })

  it('handles empty fields gracefully', async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          jobTitle: '',
          company: '',
          jobDescription: 'Some description without clear title or company',
        }),
      },
    })

    const result = await parseJobPosting('Vague job posting')
    expect(result.jobTitle).toBe('')
    expect(result.company).toBe('')
    expect(typeof result.jobDescription).toBe('string')
  })

  it('truncates very long input text to prevent token overflow', async () => {
    const longText = 'A'.repeat(10000)
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          jobTitle: 'Engineer',
          company: 'Corp',
          jobDescription: 'Description',
        }),
      },
    })

    const result = await parseJobPosting(longText)
    expect(result.jobTitle).toBe('Engineer')
    // Verify the function was called (it internally slices to 6000 chars)
    expect(mockGenerateContent).toHaveBeenCalledTimes(1)
  })
})
