import type { Request, Response } from 'express'

import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { DidModel } from '../db/models/Did'
import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'

const router = Router()

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * GET /admin/dids
 * Get all DIDs from MongoDB.
 */
router.get('/dids', getLimiter, requireRole(['admin', 'creator']), async (_req: Request, res: Response) => {
  logger.debug('Admin: fetching DIDs from MongoDB')
  try {
    const dids = await DidModel.find().lean()
    res.json(dids)
  } catch (error) {
    logger.error(error, 'Error fetching DIDs from MongoDB')
    res.status(500).json({ error: 'Failed to fetch DIDs from MongoDB' })
  }
})

export default router
