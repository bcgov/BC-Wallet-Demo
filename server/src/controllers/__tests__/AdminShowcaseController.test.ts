import { NotFoundError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('fs/promises', () => ({
  default: { unlink: vi.fn().mockResolvedValue(undefined) },
}))

vi.mock('../../utils/uploadsDir', () => ({
  UPLOADS_DIR: '/tmp/uploads',
}))

const { mockFns } = vi.hoisted(() => ({
  mockFns: {
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
    findOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
    deleteMany: vi.fn(),
  },
}))

vi.mock('../../db/models/Showcase', () => ({
  ShowcaseModel: {
    findOneAndUpdate: mockFns.findOneAndUpdate,
    findOneAndDelete: mockFns.findOneAndDelete,
    findOne: mockFns.findOne,
    find: mockFns.find,
    countDocuments: mockFns.countDocuments,
  },
}))

vi.mock('../../db/models/Asset', () => ({
  AssetModel: {
    deleteMany: mockFns.deleteMany,
  },
}))

import { AdminShowcaseController } from '../admin/AdminShowcaseController'

const mockShowcase = {
  _id: 'abc123',
  name: 'student',
  status: 'active',
  deleted_at: null,
  credentials: [],
  introduction: [],
  progressBar: [],
  scenarios: [],
}

describe('AdminShowcaseController', () => {
  let controller: AdminShowcaseController

  beforeEach(() => {
    controller = new AdminShowcaseController()
    vi.clearAllMocks()
  })

  describe('deleteShowcase', () => {
    it('soft-deletes by setting deleted_at', async () => {
      mockFns.findOneAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue({ ...mockShowcase, deleted_at: new Date() }),
      })
      const result = await controller.deleteShowcase('student')
      expect(mockFns.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'student', deleted_at: null },
        { deleted_at: expect.any(Date) },
        { new: true },
      )
      expect(result).toEqual({ message: 'Showcase deleted successfully' })
    })

    it('throws NotFoundError when showcase not found or already deleted', async () => {
      mockFns.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      await expect(controller.deleteShowcase('ghost')).rejects.toThrow(NotFoundError)
    })
  })

  describe('restoreShowcase', () => {
    it('restores by clearing deleted_at and setting status to pending', async () => {
      const restored = { ...mockShowcase, deleted_at: null, status: 'pending' }
      mockFns.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(restored) })
      const result = await controller.restoreShowcase('student')
      expect(mockFns.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'student', deleted_at: { $ne: null } },
        { deleted_at: null, status: 'pending' },
        { new: true },
      )
      expect(result).toEqual(restored)
    })

    it('throws NotFoundError when showcase does not exist', async () => {
      mockFns.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      await expect(controller.restoreShowcase('ghost')).rejects.toThrow(NotFoundError)
    })

    it('throws 409 error when showcase exists but is not deleted', async () => {
      mockFns.findOneAndUpdate.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockShowcase) })
      const err = await controller.restoreShowcase('student').catch((e) => e)
      expect(err).toBeInstanceOf(Error)
      expect((err as NodeJS.ErrnoException).code).toBe('SHOWCASE_NOT_DELETED')
    })
  })

  describe('permanentDeleteShowcase', () => {
    it('hard-deletes showcase when soft-deleted', async () => {
      const deletedShowcase = {
        _id: 'abc123',
        name: 'student',
        status: 'active',
        deleted_at: new Date(),
        credentials: [],
        introduction: [{ screenId: 'TEST', name: 'Test', text: 'test', image: '/uploads/intro.svg', credentials: [] }],
        progressBar: [],
        scenarios: [],
        persona: { name: 'Student', type: 'student', image: '/uploads/test.svg' },
      } as any
      mockFns.findOneAndDelete.mockReturnValue({ lean: vi.fn().mockResolvedValue(deletedShowcase) })
      mockFns.countDocuments.mockResolvedValue(0) // no other showcases reference these files
      mockFns.deleteMany.mockResolvedValue({ deletedCount: 2 })

      await controller.permanentDeleteShowcase('student')

      expect(mockFns.findOneAndDelete).toHaveBeenCalledWith({
        name: 'student',
        deleted_at: { $ne: null },
      })
      expect(mockFns.deleteMany).toHaveBeenCalledWith({ filename: { $in: ['test.svg', 'intro.svg'] } })
    })

    it('throws NotFoundError when showcase not found', async () => {
      mockFns.findOneAndDelete.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      await expect(controller.permanentDeleteShowcase('ghost')).rejects.toThrow(NotFoundError)
    })

    it('throws 409 error when showcase is not soft-deleted', async () => {
      mockFns.findOneAndDelete.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })
      mockFns.findOne.mockReturnValue({ lean: vi.fn().mockResolvedValue(mockShowcase) })
      const err = await controller.permanentDeleteShowcase('student').catch((e) => e)
      expect(err).toBeInstanceOf(Error)
      expect((err as NodeJS.ErrnoException).code).toBe('SHOWCASE_NOT_DELETED')
    })

    it('skips AssetModel.deleteMany when no images found', async () => {
      const noImagesShowcase = { ...mockShowcase, deleted_at: new Date() } as any
      mockFns.findOneAndDelete.mockReturnValue({ lean: vi.fn().mockResolvedValue(noImagesShowcase) })

      await controller.permanentDeleteShowcase('student')

      expect(mockFns.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('getDeletedShowcases', () => {
    it('returns items and total for soft-deleted showcases', async () => {
      const deleted = [{ ...mockShowcase, deleted_at: new Date() }]
      mockFns.find.mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(deleted) }),
        }),
      })
      mockFns.countDocuments.mockResolvedValue(1)

      const result = await controller.getDeletedShowcases(20, 0)
      expect(result.items).toEqual(deleted)
      expect(result.total).toBe(1)
    })

    it('uses default limit and skip', async () => {
      mockFns.find.mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
        }),
      })
      mockFns.countDocuments.mockResolvedValue(0)

      await controller.getDeletedShowcases()
      expect(mockFns.find).toHaveBeenCalledWith({ deleted_at: { $ne: null } })
    })
  })
})
