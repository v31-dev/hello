import os from 'os'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { getRedisClient } from '../services/redis.js'

const HOST = os.hostname()

export default async function websocket(server, authMiddleware) {
  const pubClient = getRedisClient('socketpub')
  const subClient = getRedisClient('socketsub')

  await Promise.all([pubClient.connect(), subClient.connect()])

  const io = new Server(server, {
    path: '/api/ws/',
    adapter: createAdapter(pubClient, subClient, { key: `${process.env.SERVICE}:socket.io` }),
  })

  io.engine.on('initial_headers', (headers) => {
    // custom header x-server for nginx load balancer sticky session
    headers['x-server'] = HOST
  })

  // Middleware to authenticate the user
  io.engine.use(authMiddleware)

  io.on('connection', (socket) => {
    const socketID = socket.id
    const user = socket.request.user.preferred_username
    console.log(`User ${user} connected from ${socketID}`)

    socket.on('disconnect', () => {
      console.log(`User ${user} disconnected from ${socketID}`)
    })

    socket.on('chat', (message, ack) => {
      socket.broadcast.emit('chat', {
        user: user,
        chat: message,
      })
      ack()
    })

    socket.emit('welcome', {
      host: HOST,
    })
  })
}
