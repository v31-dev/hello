import { config } from 'dotenv'
config()
import express from 'express'
import { createServer } from 'node:http'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import { auth, authSocket } from './services/auth.js'
import websocket from './routes/ws.js'
import rootRouter from './routes/root.js'
import userRouter from './routes/user.js'

const app = express()
const server = createServer(app)

app.use(morgan('combined'))
app.use(cookieParser())

websocket(server, authSocket(['hello']))

app.use('/', rootRouter)
app.use('/user', auth(['hello']), userRouter)

server.listen(4000, () => {
  console.log('listening for requests on port 4000')
})
