import { NotFoundError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { CharacterController } from '../CharacterController'

describe('CharacterController', () => {
  let controller: CharacterController

  beforeEach(() => {
    controller = new CharacterController()
  })

  describe('getCharacterById', () => {
    it('returns the character when found by type', async () => {
      const result = await controller.getCharacterById('Student')

      expect(result).toMatchObject({ type: 'Student' })
    })

    it('includes scenarios in returned character', async () => {
      const result = await controller.getCharacterById('Student')

      expect(result.scenarios).toBeDefined()
      expect(Array.isArray(result.scenarios)).toBe(true)
    })

    it('throws NotFoundError when characterId does not match any character', async () => {
      await expect(controller.getCharacterById('NonExistent')).rejects.toThrow(NotFoundError)
    })

    it('NotFoundError message references the missing characterId', async () => {
      await expect(controller.getCharacterById('Ghost')).rejects.toThrow(/"Ghost"/)
    })
  })

  describe('getCharacters', () => {
    it('returns an array of all characters', async () => {
      const result = await controller.getCharacters()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('contains the Student, Lawyer, and Proprietor character types', async () => {
      const result = await controller.getCharacters()
      const types = result.map((c) => c.type)

      expect(types).toContain('Student')
      expect(types).toContain('Lawyer')
      expect(types).toContain('Proprietor')
    })
  })
})
