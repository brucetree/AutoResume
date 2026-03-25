const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')

const router = express.Router()

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input data', errors: errors.array() })
    }

    const { name, email, password } = req.body

    try {
      const existing = await User.findOne({ email })
      if (existing) {
        return res.status(409).json({ message: 'Email already registered' })
      }

      const passwordHash = await User.hashPassword(password)
      const user = await User.create({ name, email, passwordHash })

      res.status(201).json({
        message: 'Registration successful',
        user: { _id: user._id, name: user.name, email: user.email },
      })
    } catch (err) {
      console.error('Register error:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

// POST /api/auth/login — used by NextAuth CredentialsProvider
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Invalid input data' })
    }

    const { email, password } = req.body

    try {
      const user = await User.findOne({ email })
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }

      const token = jwt.sign(
        { sub: user._id, email: user.email, name: user.name },
        process.env.NEXTAUTH_SECRET,
        { expiresIn: '7d' }
      )

      res.json({
        user: { _id: user._id, name: user.name, email: user.email },
        token,
      })
    } catch (err) {
      console.error('Login error:', err)
      res.status(500).json({ message: 'Server error' })
    }
  }
)

module.exports = router
