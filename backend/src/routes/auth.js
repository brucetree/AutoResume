const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const authMiddleware = require('../middleware/authMiddleware')

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

// PATCH /api/auth/profile — update display name
router.patch('/profile', authMiddleware, async (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Name is required' })
  }
  try {
    const userId = req.user.sub || req.user.id
    const user = await User.findByIdAndUpdate(userId, { name: name.trim() }, { new: true })
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json({ user: { _id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// PATCH /api/auth/password — change password
router.patch('/password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required' })
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters' })
  }
  try {
    const userId = req.user.sub || req.user.id
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' })
    }

    user.passwordHash = await User.hashPassword(newPassword)
    await user.save()
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    console.error('Password change error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// DELETE /api/auth/account — delete user account and all data
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id
    const Resume = require('../models/Resume')
    const Application = require('../models/Application')

    // Delete all user data
    await Resume.deleteMany({ userId })
    await Application.deleteMany({ userId })
    await User.findByIdAndDelete(userId)

    res.json({ message: 'Account deleted successfully' })
  } catch (err) {
    console.error('Account delete error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
