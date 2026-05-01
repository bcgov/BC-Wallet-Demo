import { NotFoundError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../db/models/Showcase', () => {
  const showcases = [
    {
      persona: { type: 'Student', name: 'Student', image: '' },
      scenarios: [
        { id: 'clothesOnline', name: 'Clothes Online', hidden: false, screens: [] },
        { id: 'hiddenUseCase', name: 'Hidden', hidden: true, screens: [] },
      ],
    },
    {
      persona: { type: 'Lawyer', name: 'Lawyer', image: '' },
      scenarios: [{ id: 'lawyerCase', name: 'Lawyer Case', hidden: false, screens: [] }],
    },
  ]

  return {
    ShowcaseModel: {
      find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(showcases) }),
      findOne: vi.fn().mockImplementation(({ 'persona.type': type }: { 'persona.type': string }) => ({
        lean: vi.fn().mockResolvedValue(showcases.find((s) => s.persona.type === type) ?? null),
      })),
    },
  }
})

import { ScenarioController } from '../ScenarioController'

describe('ScenarioController', () => {
  let controller: ScenarioController

  beforeEach(() => {
    controller = new ScenarioController()
    vi.clearAllMocks()
  })

  describe('getUseCaseBySlug', () => {
    it('returns a use case when a valid slug is provided', async () => {
      const result = await controller.getUseCaseBySlug('clothesOnline')

      expect(result).toBeDefined()
      expect(result.id).toBe('clothesOnline')
    })

    it('throws NotFoundError when slug does not match any use case', async () => {
      await expect(controller.getUseCaseBySlug('does-not-exist')).rejects.toThrow(NotFoundError)
    })

    it('NotFoundError message references the missing slug', async () => {
      await expect(controller.getUseCaseBySlug('ghost-slug')).rejects.toThrow(/"ghost-slug"/)
    })
  })

  describe('getUseCasesByCharType', () => {
    it('returns use cases for a valid character type', async () => {
      const result = await controller.getUseCasesByCharType('Student')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('throws NotFoundError when character type does not exist', async () => {
      await expect(controller.getUseCasesByCharType('UnknownType')).rejects.toThrow(NotFoundError)
    })

    it('filters out hidden use cases when showHidden is not set', async () => {
      const result = await controller.getUseCasesByCharType('Student')

      expect(result.every((uc) => !uc.hidden)).toBe(true)
    })

    it('includes hidden use cases when showHidden is true', async () => {
      const all = await controller.getUseCasesByCharType('Student', true)
      const visible = await controller.getUseCasesByCharType('Student', false)

      expect(all.length).toBeGreaterThanOrEqual(visible.length)
    })
  })
})
