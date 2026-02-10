import { JwksClient } from 'jwks-rsa'
import jwt from 'jsonwebtoken'

const AUTH_CLIENT_ID = process.env.AUTH_CLIENT_ID
const AUTH_URL = process.env.AUTH_URL

// JWKS Client setup
const client = new JwksClient({
  jwksUri: `${AUTH_URL}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5,
})

// Function to get signing key
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err)
    }
    const signingKey = key.getPublicKey()
    callback(null, signingKey)
  })
}

// Auth middleware for Express routes
function auth(roles = []) {
  return (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization']
    if (!authHeader) {
      return res.status(401).json({ detail: 'Authorization header missing' })
    }
    const token = authHeader.split(' ')[1]

    // Verify the token
    jwt.verify(token, getKey, { issuer: AUTH_URL }, (err, decoded) => {
      if (err) {
        return res
          .status(401)
          .json({ detail: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' })
      }

      // Validate audience (client ID)
      const audience = decoded.aud || []
      if (!audience.includes(AUTH_CLIENT_ID)) {
        return res.status(401).json({ detail: 'Token not issued for this client.' })
      }

      console.log(`User verified: ${decoded.preferred_username} (${decoded.name})`)

      // Role check
      const userRoles = decoded.groups || []
      for (const role of roles) {
        if (!userRoles.includes(role)) {
          return res.status(401).json({ detail: `Role [${role}] is required.` })
        }
      }

      // Attach decoded token to request if needed
      req.user = decoded
      next()
    })
  }
}

// Auth middleware for Socket.IO connections
function authSocket(roles = []) {
  return (req, res, next) => {
    // Only check handshake, not packet requests
    const isHandshake = req._query.sid === undefined
    if (!isHandshake) {
      return next()
    }

    // Try to get token from headers or from Socket.IO handshake auth
    let authHeader = req.headers['authorization']
    if (!authHeader && req._query && req._query.token) {
      authHeader = `Bearer ${req._query.token}`
    }

    if (!authHeader) {
      const err = new Error('Authorization header missing')
      err.data = { code: 'AUTH_MISSING', message: 'Authorization header missing' }
      return next(err)
    }

    const token = authHeader.split(' ')[1]
    jwt.verify(token, getKey, { issuer: AUTH_URL }, (err, decoded) => {
      if (err) {
        const errorMsg = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        const error = new Error(errorMsg)
        error.data = { code: err.name, message: errorMsg }
        return next(error)
      }

      // Validate audience (client ID)
      const audience = decoded.aud || []
      if (!audience.includes(AUTH_CLIENT_ID)) {
        const error = new Error('Token not issued for this client.')
        error.data = { code: 'INVALID_AUDIENCE', message: 'Token not issued for this client.' }
        return next(error)
      }

      console.log(`User verified: ${decoded.preferred_username} (${decoded.name})`)

      // Role check
      const userRoles = decoded.groups || []
      for (const role of roles) {
        if (!userRoles.includes(role)) {
          const error = new Error(`Role [${role}] is required.`)
          error.data = { code: 'ROLE_REQUIRED', message: `Role [${role}] is required.` }
          return next(error)
        }
      }
      req.user = decoded
      next()
    })
  }
}

export { auth, authSocket }
