import type { CustomCharacter } from '../content/types'
import type { Request, Response } from 'express'

import { Router } from 'express'

import { requireRole } from '../middleware/requireAdmin'
import { businessCustom } from '../../config/businessCustom'
import { lawyerCustom } from '../../config/lawyerCustom'
import { studentCustom } from '../../config/studentCustom'
import logger from '../utils/logger'

const router = Router()

// All available characters in order.
const characters: CustomCharacter[] = [studentCustom, lawyerCustom, businessCustom]

/**
 * GET /admin/characters
 * List all characters.
 * Requires: admin or creator or viewer role
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), (_req: Request, res: Response) => {
  logger.debug('Admin: list characters')
  res.json(characters)
})

/**
 * GET /admin/characters/:id
 * Get a single character by id (0-based index).
 * Requires: admin or creator or viewer role
 */
router.get('/:id', requireRole(['admin', 'creator', 'viewer']), (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10)
  logger.debug({ id }, 'Admin: get character')

  if (Number.isNaN(id) || id < 0 || id >= characters.length) {
    res.status(404).json({ error: `Character ${req.params.id} not found` })
    return
  }

  res.json(characters[id])
})

/**
 * POST /admin/characters
 * Create a new character.
 * Requires: admin or creator role
 */
router.post('/', requireRole(['admin', 'creator']), (req: Request, res: Response) => {
  logger.debug({ body: req.body }, 'Admin: create character')
  res.status(201).json({ message: 'Create character — not yet implemented' })
})

/**
 * PUT /admin/characters/:id
 * Replace a character.
 * Requires: admin or creator role
 */
router.put('/:id', requireRole(['admin', 'creator']), (req: Request, res: Response) => {
  logger.debug({ id: req.params.id, body: req.body }, 'Admin: update character')
  res.json({ message: `Update character ${req.params.id} — not yet implemented` })
})

/**
 * DELETE /admin/characters/:id
 * Delete a character.
 * Requires: admin role
 */
router.delete('/:id', requireRole(['admin']), (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: delete character')
  res.status(204).send()
})

export default router
