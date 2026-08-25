import { NotFoundError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    findOne: vi.fn(),
    find: vi.fn(),
  },
}))

vi.mock('../../db/models/Showcase', () => ({
  ShowcaseModel: {
    findOne: mockFns.findOne,
    find: mockFns.find,
  },
}))

vi.mock('../../db/models/Credential', () => ({
  CredentialModel: { find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) },
}))

import { ShowcaseController } from '../ShowcaseController'

const mockShowcase = {
  _id: 'abc123',
  name: 'student',
  slug: 'student',
  status: 'hidden',
  deleted_at: null,
  credentials: [],
  introduction: [],
  progressBar: [],
  scenarios: [],
}

describe('ShowcaseController', () => {
  let controller: ShowcaseController

  beforeEach(() => {
    controller = new ShowcaseController()
    vi.clearAllMocks()
  })

  describe('getShowcaseBySlug', () => {
    it('returns the showcase regardless of status (e.g. hidden)', async () => {
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockShowcase) })

      const result = await controller.getShowcaseBySlug('student')

      expect(mockFns.findOne).toHaveBeenCalledWith({ slug: 'student', deleted_at: null })
      expect(result).toMatchObject({ slug: 'student', status: 'hidden' })
    })

    it('throws NotFoundError when no matching slug exists', async () => {
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

      await expect(controller.getShowcaseBySlug('missing')).rejects.toThrow(NotFoundError)
    })
  })
})
