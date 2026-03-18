const request = require('supertest')
const mongoose = require('mongoose')
const { app, server } = require('../src/index')
const User = require('../src/models/User')

const MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://admin:password@localhost:27017/autoresume_test?authSource=admin'

beforeAll(async () => {
  await mongoose.connect(MONGO_URI)
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
  server.close()
})

beforeEach(async () => {
  await User.deleteMany({})
})

describe('POST /api/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.email).toBe('test@example.com')
    expect(res.body.user).not.toHaveProperty('passwordHash')
  })

  it('rejects duplicate email', async () => {
    await User.create({
      name: 'Existing',
      email: 'test@example.com',
      passwordHash: await User.hashPassword('password123'),
    })
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(409)
  })

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
    })
    expect(res.status).toBe(400)
  })

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'password123',
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: await User.hashPassword('password123'),
    })
  })

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('test@example.com')
  })

  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    })
    expect(res.status).toBe(401)
  })

  it('rejects non-existent user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'password123',
    })
    expect(res.status).toBe(401)
  })
})
