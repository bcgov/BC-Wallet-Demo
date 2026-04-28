import type { CustomCharacter } from '../content/types'
import type { Request, Response } from 'express'

import { Router } from 'express'
import fs from 'fs'
import path from 'path'

import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'

const router = Router()

// In-memory data store for characters
const characterStore = new Map<string, CustomCharacter>()

// Load initial characters from config files into memory
const configDir = path.join(__dirname, '../../config')
const customCharacterFiles = fs
  .readdirSync(configDir)
  .filter((file) => file.endsWith('Custom.ts') || file.endsWith('Custom.js'))

customCharacterFiles.forEach((file) => {
  const modulePath = path.join(configDir, file.replace(/\.(ts|js)$/, ''))
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require(modulePath)
    // Find the export that is a CustomCharacter (ends with 'Custom')
    const customKey = Object.keys(module).find((key) => key.endsWith('Custom'))
    if (customKey) {
      const character = module[customKey] as CustomCharacter
      characterStore.set(character.name, character)
    }
  } catch (error) {
    logger.error({ file, error }, 'Failed to load custom character')
  }
})

/**
 * GET /admin/characters
 * List all characters.
 * Requires: admin or creator or viewer role
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), (_req: Request, res: Response) => {
  logger.debug('Admin: list characters')
  const characters = Array.from(characterStore.values())
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

  const character = characterStore.get(name)

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

    // Check if character already exists in memory
    if (characterStore.has(name)) {
      return res.status(409).json({ error: 'Showcase with this name already exists' })
    }

    // Create new character object
    const newCharacter: CustomCharacter = {
      name,
      type: description || '',
      image: '',
      revocationInfo: [],
      progressBar: [],
      onboarding: [],
      useCases: [],
    }

    // Store in memory
    characterStore.set(name, newCharacter)
    logger.info({ name }, 'Created new showcase in memory')

    res.status(201).json({
      success: true,
      message: 'Showcase created successfully',
      name: name,
    })
  } catch (error) {
    logger.error({ error }, 'Error creating showcase')
    res.status(500).json({ error: 'Failed to create showcase' })
  }
})

/**
 * PUT /admin/characters/:id
 * Update a character.
 * Requires: admin or creator role
 */
router.put('/:id', requireRole(['admin', 'creator']), (req: Request, res: Response) => {
  try {
    const characterName = req.params.id
    const updatedData = req.body as Partial<CustomCharacter>

    logger.debug({ id: characterName, body: updatedData }, 'Admin: update character')

    // Get the character from memory
    const character = characterStore.get(characterName)
    if (!character) {
      return res.status(404).json({ error: `Character ${characterName} not found` })
    }

    // Merge the existing character with updated data
    const updatedCharacter: CustomCharacter = {
      ...character,
      ...updatedData,
    }

    // Update in memory
    characterStore.set(characterName, updatedCharacter)
    logger.info({ id: characterName }, 'Character updated successfully in memory')

    res.json({
      success: true,
      message: `Character ${characterName} updated successfully`,
      character: updatedCharacter,
    })
  } catch (error) {
    logger.error({ error }, 'Error updating character')
    res.status(500).json({ error: 'Failed to update character' })
  }
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
