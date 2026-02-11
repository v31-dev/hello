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
function auth() {
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

      // Attach decoded token to request if needed
      req.user = decoded
      next()
    })
  }
}

// Auth middleware for Socket.IO connections
function authSocket() {
  return (socket, next) => {
    // Get token from Socket.io handshake auth
    const token = socket.handshake.auth.token
    
    if (!token) {
      const err = new Error('Authorization token missing')
      err.data = { code: 'AUTH_MISSING', message: 'Authorization token missing' }
      return next(err)
    }

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

      // Attach user to socket for later use
      socket.request.user = decoded
      next()
    })
  }
}

export { auth, authSocket }
