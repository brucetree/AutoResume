const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const User = require('../src/models/User')

// Mock the geminiService to avoid real API calls
jest.mock('../src/services/geminiService', () => ({
  analyzeAndModify: jest.fn(),
  parseJobPosting: jest.fn().mockResolvedValue({
    jobTitle: 'Software Engineer',
    company: 'TestCorp',
    jobDescription: 'Build scalable systems with Node.js and React.',
  }),
}))

// Mock global fetch for URL fetching
global.fetch = jest.fn()

const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://admin:password@localhost:27017/autoresume_test?authSource=admin'

let authToken

beforeAll(async () => {
  await mongoose.connect(MONGO_URI)
  // Create a test user and generate a token
  const user = await User.create({
    name: 'Test User',
    email: 'parseurl@test.com',
    passwordHash: await User.hashPassword('password123'),
  })
  authToken = jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.NEXTAUTH_SECRET || 'test-secret',
    { expiresIn: '1h' }
  )
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

describe('POST /api/jobs/parse-url', () => {
  beforeEach(() => {
    global.fetch.mockReset()
  })

  it('returns parsed job data from a valid URL', async () => {
    global.fetch.mockResolvedValue({
      text: () => Promise.resolve('<html><body><h1>Software Engineer at TestCorp</h1><p>Build scalable systems...</p></body></html>'),
    })

    const res = await request(app)
      .post('/api/jobs/parse-url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://example.com/job/123' })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('jobTitle', 'Software Engineer')
    expect(res.body).toHaveProperty('company', 'TestCorp')
    expect(res.body).toHaveProperty('jobDescription')
  })

  it('returns 400 when URL is missing', async () => {
    const res = await request(app)
      .post('/api/jobs/parse-url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('URL is required')
  })

  it('returns 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/jobs/parse-url')
      .send({ url: 'https://example.com/job/123' })

    expect(res.status).toBe(401)
  })

  it('returns 500 when URL fetch fails', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    const res = await request(app)
      .post('/api/jobs/parse-url')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ url: 'https://invalid-url.example.com' })

    expect(res.status).toBe(500)
    expect(res.body.message).toBe('Failed to parse job URL')
  })
})
