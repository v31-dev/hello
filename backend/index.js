import { config } from 'dotenv'
config()
import express from 'express'
import { createServer } from 'node:http'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { auth, authSocket } from './services/auth.js'
import websocket from './routes/ws.js'
import rootRouter from './routes/root.js'
import userRouter from './routes/user.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const server = createServer(app)

app.use(morgan('combined'))
app.use(cookieParser())

websocket(server, authSocket(['hello']))

// Serve static frontend files first
const publicPath = path.join(__dirname, 'public')
app.use(express.static(publicPath))

// API routes
app.use('/api', rootRouter)
app.use('/api/user', auth(['hello']), userRouter)

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'))
})

server.listen(4000, () => {
  console.log('listening for requests on port 4000')
})

// Graceful shutdown handlers
const shutdown = () => {
  console.log('Shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

