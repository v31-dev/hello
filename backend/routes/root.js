import express from 'express'
const router = express.Router()

router.head('/', (_, res) => res.sendStatus(200))
router.get('/', (_, res) => res.sendStatus(200))

export default router
