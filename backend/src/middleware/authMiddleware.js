const jwt = require('jsonwebtoken')

/**
 * Verifies the NextAuth JWT token sent via cookie or Authorization header.
 * NextAuth uses NEXTAUTH_SECRET to sign JWTs.
 */
function authMiddleware(req, res, next) {
  // Try Authorization header first, then cookie
  let token = null

  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else if (req.cookies && req.cookies['next-auth.session-token']) {
    token = req.cookies['next-auth.session-token']
  } else if (req.cookies && req.cookies['__Secure-next-auth.session-token']) {
    token = req.cookies['__Secure-next-auth.session-token']
  }

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  try {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) throw new Error('NEXTAUTH_SECRET not configured')
    const decoded = jwt.verify(token, secret)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

module.exports = authMiddleware
