import type { Request, Response } from 'express'

import { Router } from 'express'

import logger from '../utils/logger'

const router = Router()

/**
 * GET /admin/characters
 * List all characters.
 */
router.get('/', (_req: Request, res: Response) => {
  logger.debug('Admin: list characters')
  res.json({ message: 'List characters — not yet implemented' })
})

/**
 * GET /admin/characters/:id
 * Get a single character by id.
 */
router.get('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: get character')
  res.json({ message: `Get character ${req.params.id} — not yet implemented` })
})

/**
 * POST /admin/characters
 * Create a new character.
 */
router.post('/', (req: Request, res: Response) => {
  logger.debug({ body: req.body }, 'Admin: create character')
  res.status(201).json({ message: 'Create character — not yet implemented' })
})

/**
 * PUT /admin/characters/:id
 * Replace a character.
 */
router.put('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id, body: req.body }, 'Admin: update character')
  res.json({ message: `Update character ${req.params.id} — not yet implemented` })
})

/**
 * DELETE /admin/characters/:id
 * Delete a character.
 */
router.delete('/:id', (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: delete character')
  res.status(204).send()
})

export default router
