import type { Request, Response } from 'express'

import { Router } from 'express'

import logger from '../utils/logger'

const router = Router()

/**
 * GET /admin/showcases
 * List all showcases.
 */
router.get('/', (_req: Request, res: Response) => {
  logger.debug('Admin: list showcases')
  res.json({ message: 'List showcases — not yet implemented' })
})

/**
 * GET /admin/showcases/:id
 * Get a single showcase by id.
 */
router.get('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: get showcase')
  res.json({ message: `Get showcase ${req.params.id} — not yet implemented` })
})

/**
 * POST /admin/showcases
 * Create a new showcase.
 */
router.post('/', (req: Request, res: Response) => {
  logger.debug({ body: req.body }, 'Admin: create showcase')
  res.status(201).json({ message: 'Create showcase — not yet implemented' })
})

/**
 * PUT /admin/showcases/:id
 * Replace a showcase.
 */
router.put('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id, body: req.body }, 'Admin: update showcase')
  res.json({ message: `Update showcase ${req.params.id} — not yet implemented` })
})

/**
 * DELETE /admin/showcases/:id
 * Delete a showcase.
 */
router.delete('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: delete showcase')
  res.status(204).send()
})

export default router
