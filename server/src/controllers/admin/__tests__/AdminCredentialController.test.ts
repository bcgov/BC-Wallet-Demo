import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../../utils/tractionHelper', () => ({
  tractionRequest: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Hoisted so the class mock is available at module load time.
const { mockFindById, mockFindByIdAndUpdate, mockFind, mockSave, constructorCalls } = vi.hoisted(() => {
  const mockSave = vi.fn().mockResolvedValue({})
  const constructorCalls: any[] = []
  const mockFindById = vi.fn()
  const mockFindByIdAndUpdate = vi.fn()
  const mockFind = vi.fn()

  return { mockFindById, mockFindByIdAndUpdate, mockFind, mockSave, constructorCalls }
})

vi.mock('../../../db/models/Credential', () => {
  function MockCredentialModel(this: any, data: any) {
    constructorCalls.push(data)
    Object.assign(this, data)
    this.save = mockSave
  }
  MockCredentialModel.findById = mockFindById
  MockCredentialModel.findByIdAndUpdate = mockFindByIdAndUpdate
  MockCredentialModel.find = mockFind

  return { CredentialModel: MockCredentialModel }
})
import { AdminCredentialController } from '../AdminCredentialController'

describe('AdminCredentialController', () => {
  let controller: AdminCredentialController

  beforeEach(() => {
    controller = new AdminCredentialController()
    vi.resetAllMocks()
    constructorCalls.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ============================================================================
  // updateCredential -- PUT restrictions
  // ============================================================================

  describe('updateCredential', () => {
    it('allows all fields when schema_id is not set', async () => {
      mockFindById.mockResolvedValue({ _id: 'local-card', schema_id: undefined })
      mockFindByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'local-card',
          name: 'Updated',
          icon: '/i.svg',
          version: '2.0',
          attributes: [],
          schema_id: 'ABC:2:local_card:2.0',
          cred_def_ids: ['ABC:3:CL:1:tag'],
        }),
      })

      await expect(controller.updateCredential('local-card', { name: 'Updated' })).resolves.toBeDefined()
    })

    it('rejects update to name when schema_id is set', async () => {
      mockFindById.mockResolvedValue({ _id: 'traction-card', schema_id: 'ABC:2:student_card:1.6' })

      await expect(controller.updateCredential('traction-card', { name: 'New Name' })).rejects.toThrow()
    })

    it('rejects update to version when schema_id is set', async () => {
      mockFindById.mockResolvedValue({ _id: 'traction-card', schema_id: 'ABC:2:student_card:1.6' })

      await expect(controller.updateCredential('traction-card', { version: '9.9' })).rejects.toThrow()
    })

    it('allows update to icon when schema_id is set', async () => {
      mockFindById.mockResolvedValue({ _id: 'traction-card', schema_id: 'ABC:2:student_card:1.6' })
      mockFindByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'traction-card',
          name: 'student_card',
          icon: '/new.svg',
          version: '1.6',
          attributes: [],
          schema_id: 'ABC:2:student_card:1.6',
          cred_def_ids: ['ABC:3:CL:100:student_card'],
        }),
      })

      await expect(controller.updateCredential('traction-card', { icon: '/new.svg' })).resolves.toBeDefined()
    })

    it('allows update to status when schema_id is set', async () => {
      mockFindById.mockResolvedValue({ _id: 'traction-card', schema_id: 'ABC:2:student_card:1.6' })
      mockFindByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'traction-card',
          name: 'student_card',
          icon: '/i.svg',
          version: '1.6',
          attributes: [],
          schema_id: 'ABC:2:student_card:1.6',
          cred_def_ids: ['ABC:3:CL:100:student_card'],
          status: 'retired',
        }),
      })

      await expect(controller.updateCredential('traction-card', { status: 'retired' })).resolves.toBeDefined()
    })

    it('returns 404 when credential not found', async () => {
      mockFindById.mockResolvedValue(null)

      await expect(controller.updateCredential('nonexistent', { icon: '/i.svg' })).rejects.toThrow('not found')
    })
  })

  // ============================================================================
  // deleteCredential -- soft-delete
  // ============================================================================

  describe('deleteCredential', () => {
    it('sets status to retired instead of deleting the doc', async () => {
      const retired = {
        _id: 'student-card',
        name: 'Student Card',
        icon: '/i.svg',
        version: '1.6',
        attributes: [],
        schema_id: 'ABC:2:student_card:1.6',
        cred_def_ids: ['ABC:3:CL:100:student_card'],
        status: 'retired',
      }
      mockFindByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(retired),
      })

      const result = await controller.deleteCredential('student-card')

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'student-card',
        { status: 'retired' },
        expect.objectContaining({ new: true }),
      )
      expect(result).toMatchObject({ status: 'retired' })
    })

    it('returns 404 when credential not found', async () => {
      mockFindByIdAndUpdate.mockReturnValue({
        lean: vi.fn().mockResolvedValue(null),
      })

      await expect(controller.deleteCredential('nonexistent')).rejects.toThrow('not found')
    })
  })
})
