import express from 'express'
const router = express.Router()

router.get('/', (req, res) => {
  res.json(req.user)
})

export default router
