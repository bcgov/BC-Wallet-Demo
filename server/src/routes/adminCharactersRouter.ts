import type { CustomCharacter } from '../content/types'
import type { Request, Response } from 'express'

import { Router } from 'express'

import { businessCustom } from '../../config/businessCustom'
import { lawyerCustom } from '../../config/lawyerCustom'
import { studentCustom } from '../../config/studentCustom'
import { requireRole } from '../middleware/requireAdmin'
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
 * Get a single character by name.
 * Requires: admin or creator or viewer role
 */
router.get('/:id', requireRole(['admin', 'creator', 'viewer']), (req: Request, res: Response) => {
  const name = req.params.id
  logger.debug({ name }, 'Admin: get character')

  const character = characters.find((c) => c.name === name)

  if (!character) {
    res.status(404).json({ error: `Character ${name} not found` })
    return
  }

  res.json(character)
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
