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
 * Create a new showcase (development only).
 * Requires: admin or creator role
 */
router.post('/', requireRole(['admin', 'creator']), (req: Request, res: Response) => {
  try {
    const { name, description } = req.body

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Showcase name is required' })
    }

    // Sanitize the name to create a valid filename
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .replace(/^[0-9]+/, '')

    if (sanitizedName.length === 0) {
      return res.status(400).json({ error: 'Invalid showcase name' })
    }

    const filename = `${sanitizedName}Custom.ts`
    const configDir = path.join(__dirname, '../../config')
    const filepath = path.join(configDir, filename)

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      return res.status(409).json({ error: 'Showcase with this name already exists' })
    }

    // Create the config file template
    const template = `import type { CustomCharacter } from '../src/content/types'

import { getDateInt } from '../src/utils/dateint'

export const ${sanitizedName}Custom: CustomCharacter = {
  name: '${name}',
  type: 'Custom',
  image: '/public/common/icon-person-light.svg',
  description: '${description || ''}',
  revocationInfo: [],
  progressBar: [
    {
      name: 'person',
      onboardingStep: 'PICK_CHARACTER',
      iconLight: '/public/common/icon-person-light.svg',
      iconDark: '/public/common/icon-person-dark.svg',
    },
  ],
  onboarding: [
    {
      screenId: 'PICK_CHARACTER',
      title: 'Meet ${name}',
      text: 'This is a new showcase for ${name}.',
    },
  ],
  useCases: [],
}
`

    // Write the file
    fs.writeFileSync(filepath, template)
    logger.info(`Created new showcase config: ${filename}`)

    res.status(201).json({
      success: true,
      message: 'Showcase created successfully',
      filename,
      name: sanitizedName,
    })
  } catch {
    logger.error('Error creating showcase')
    res.status(500).json({ error: 'Failed to create showcase' })
  }
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
