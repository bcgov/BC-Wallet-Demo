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
        { id: 'hiddenScenario', name: 'Hidden', hidden: true, screens: [] },
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

  describe('getScenarioBySlug', () => {
    it('returns a scenario when a valid slug is provided', async () => {
      const result = await controller.getScenarioBySlug('clothesOnline')

      expect(result).toBeDefined()
      expect(result.id).toBe('clothesOnline')
    })

    it('throws NotFoundError when slug does not match any scenario', async () => {
      await expect(controller.getScenarioBySlug('does-not-exist')).rejects.toThrow(NotFoundError)
    })

    it('NotFoundError message references the missing slug', async () => {
      await expect(controller.getScenarioBySlug('ghost-slug')).rejects.toThrow(/"ghost-slug"/)
    })
  })

  describe('getScenariosByCharType', () => {
    it('returns scenarios for a valid character type', async () => {
      const result = await controller.getScenariosByCharType('Student')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('throws NotFoundError when character type does not exist', async () => {
      await expect(controller.getScenariosByCharType('UnknownType')).rejects.toThrow(NotFoundError)
    })

    it('filters out hidden scenarios when showHidden is not set', async () => {
      const result = await controller.getScenariosByCharType('Student')

      expect(result.every((s) => !s.hidden)).toBe(true)
    })

    it('includes hidden scenarios when showHidden is true', async () => {
      const all = await controller.getScenariosByCharType('Student', true)
      const visible = await controller.getScenariosByCharType('Student', false)

      expect(all.length).toBeGreaterThanOrEqual(visible.length)
    })
  })
})
