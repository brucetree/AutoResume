// Mock the Gemini SDK before requiring the service
jest.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              gapAnalysis: '- 缺少 React 经验\n- 需要加强 TypeScript 技能',
              modifiedResume: '# 张三\n\n## 工作经验\n...',
            }),
          },
        }),
      }),
    })),
  }
})

process.env.GEMINI_API_KEY = 'test-key'

const { analyzeAndModify } = require('../src/services/geminiService')

describe('analyzeAndModify', () => {
  it('returns gapAnalysis and modifiedResume', async () => {
    const result = await analyzeAndModify('My resume text', 'Job description text')
    expect(result).toHaveProperty('gapAnalysis')
    expect(result).toHaveProperty('modifiedResume')
    expect(typeof result.gapAnalysis).toBe('string')
    expect(typeof result.modifiedResume).toBe('string')
  })

  it('handles malformed JSON response gracefully', async () => {
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: () => ({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => 'raw text response without JSON' },
        }),
      }),
    }))

    const result = await analyzeAndModify('resume', 'job')
    expect(result).toHaveProperty('gapAnalysis')
    expect(result).toHaveProperty('modifiedResume')
  })
})
