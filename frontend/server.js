import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// Serve static files
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback: serve index.html for all routes
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`)
})
