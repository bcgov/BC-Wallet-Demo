import type { CustomCharacter } from '../content/types'
import type { Request, Response } from 'express'

import { Router } from 'express'
import fs from 'fs'
import path from 'path'

import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'

const router = Router()

// Dynamically load all Custom character files from /config/
const configDir = path.join(__dirname, '../../config')
const customCharacterFiles = fs
  .readdirSync(configDir)
  .filter((file) => file.endsWith('Custom.ts') || file.endsWith('Custom.js'))

const characters: CustomCharacter[] = customCharacterFiles
  .map((file) => {
    const modulePath = path.join(configDir, file.replace(/\.(ts|js)$/, ''))
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require(modulePath)
      // Find the export that is a CustomCharacter (ends with 'Custom')
      const customKey = Object.keys(module).find((key) => key.endsWith('Custom'))
      return customKey ? module[customKey] : null
    } catch (error) {
      logger.error({ file, error }, 'Failed to load custom character')
      return null
    }
  })
  .filter((char): char is CustomCharacter => char !== null)

// Extract all nested credentials from onboarding steps of all characters
const credentials = characters.flatMap((character) => character.onboarding.flatMap((step) => step.credentials ?? []))

/**
 * GET /admin/characters
 * List all credentials from onboarding steps across all characters.
 * Requires: admin or creator or viewer role
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), (_req: Request, res: Response) => {
  logger.debug('Admin: list credentials')
  res.json(credentials)
})

/**
 * GET /admin/characters/:id
 * Get a single credential by name.
 * Requires: admin or creator or viewer role
 */
router.get('/:id', requireRole(['admin', 'creator', 'viewer']), (req: Request, res: Response) => {
  const name = req.params.id
  logger.debug({ name }, 'Admin: get credential')

  const credential = credentials.find((c) => c.name === name)

  if (!credential) {
    res.status(404).json({ error: `Credential ${name} not found` })
    return
  }

  res.json(credential)
})

export default router
