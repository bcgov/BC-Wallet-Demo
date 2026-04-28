import { NotFoundError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { ShowcaseController } from '../ShowcaseController.ts'

describe('ShowcaseController', () => {
  let controller: ShowcaseController

  beforeEach(() => {
    controller = new ShowcaseController()
  })

  describe('getShowcaseById', () => {
    it('returns the showcase when found by type', async () => {
      const result = await controller.getShowcaseById('Student')

      expect(result).toMatchObject({ persona: { type: 'Student' } })
    })

    it('includes scenarios in returned character', async () => {
      const result = await controller.getShowcaseById('Student')

      expect(result.scenarios).toBeDefined()
      expect(Array.isArray(result.scenarios)).toBe(true)
    })

    it('throws NotFoundError when characterId does not match any character', async () => {
      await expect(controller.getShowcaseById('NonExistent')).rejects.toThrow(NotFoundError)
    })

    it('NotFoundError message references the missing characterId', async () => {
      await expect(controller.getShowcaseById('Ghost')).rejects.toThrow(/"Ghost"/)
    })
  })

  describe('getShowcases', () => {
    it('returns an array of all showcases', async () => {
      const result = await controller.getShowcases()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('contains the Student, Lawyer, and Proprietor showcase types', async () => {
      const result = await controller.getShowcases()
      const types = result.map((c) => c.persona.type)

      expect(types).toContain('Student')
      expect(types).toContain('Lawyer')
      expect(types).toContain('Proprietor')
    })
  })
})
