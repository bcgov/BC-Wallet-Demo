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
// MockCredentialModel records constructor args and provides static stubs.
const { mockFindById, mockFindByIdAndUpdate, mockSave, constructorCalls } = vi.hoisted(() => {
  const mockSave = vi.fn().mockResolvedValue({})
  const constructorCalls: any[] = []
  const mockFindById = vi.fn()
  const mockFindByIdAndUpdate = vi.fn()

  return { mockFindById, mockFindByIdAndUpdate, mockSave, constructorCalls }
})

vi.mock('../../../db/models/Credential', () => {
  function MockCredentialModel(this: any, data: any) {
    constructorCalls.push(data)
    Object.assign(this, data)
    this.save = mockSave
  }
  MockCredentialModel.findById = mockFindById
  MockCredentialModel.findByIdAndUpdate = mockFindByIdAndUpdate

  return { CredentialModel: MockCredentialModel }
})

import logger from '../../../utils/logger'
import { tractionRequest } from '../../../utils/tractionHelper'
import { AdminCredentialController } from '../AdminCredentialController'

const TRACTION_SCHEMA_STORAGE_RESPONSE = {
  results: [
    {
      schema_id: 'ABC:2:student_card:1.6',
      schema: {
        name: 'student_card',
        version: '1.6',
        attrNames: ['first_name', 'last_name', 'expiry_date'],
      },
    },
    {
      schema_id: 'ABC:2:member_card:1.54',
      schema: {
        name: 'member_card',
        version: '1.54',
        attrNames: ['Given Name', 'Surname', 'PPID'],
      },
    },
  ],
}

const TRACTION_CRED_DEF_STORAGE_RESPONSE = {
  results: [
    {
      cred_def_id: 'ABC:3:CL:100:student_card',
      schema_id: 'ABC:2:student_card:1.6',
    },
    {
      cred_def_id: 'ABC:3:CL:200:member_card',
      schema_id: 'ABC:2:member_card:1.54',
    },
  ],
}

describe('AdminCredentialController', () => {
  let controller: AdminCredentialController

  beforeEach(() => {
    controller = new AdminCredentialController()
    vi.clearAllMocks()
    constructorCalls.length = 0
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ============================================================================
  // syncCredentials
  // ============================================================================

  describe('syncCredentials', () => {
    it('imports new schemas not in MongoDB', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: TRACTION_SCHEMA_STORAGE_RESPONSE } as any)
        .mockResolvedValueOnce({ data: TRACTION_CRED_DEF_STORAGE_RESPONSE } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      const result = await controller.syncCredentials()

      expect(result.imported).toBe(2)
      expect(result.updated).toBe(0)
      expect(result.total).toBe(2)
      expect(constructorCalls).toHaveLength(2)
    })

    it('generates correct slug _id from schema name and version', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                schema_id: 'ABC:2:student_card:1.6',
                schema: { name: 'student_card', version: '1.6', attrNames: ['field'] },
              },
            ],
          },
        } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      await controller.syncCredentials()

      // student_card + 1.6 -> underscores stripped, dots stripped -> "studentcard-16"
      expect(constructorCalls[0]).toMatchObject({ _id: 'studentcard-16' })
    })

    it('uses default icon for imported credentials', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                schema_id: 'ABC:2:student_card:1.6',
                schema: { name: 'student_card', version: '1.6', attrNames: ['field'] },
              },
            ],
          },
        } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      await controller.syncCredentials()

      expect(constructorCalls[0]).toMatchObject({ icon: '/public/common/icon/icon-balloon-light.svg' })
    })

    it('builds attributes from attrNames with empty string values', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                schema_id: 'ABC:2:student_card:1.6',
                schema: { name: 'student_card', version: '1.6', attrNames: ['first_name', 'expiry_date'] },
              },
            ],
          },
        } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      await controller.syncCredentials()

      expect(constructorCalls[0]).toMatchObject({
        attributes: [
          { name: 'first_name', value: '' },
          { name: 'expiry_date', value: '' },
        ],
      })
    })

    it('maps cred_def_ids to correct schema', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: TRACTION_SCHEMA_STORAGE_RESPONSE } as any)
        .mockResolvedValueOnce({ data: TRACTION_CRED_DEF_STORAGE_RESPONSE } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      await controller.syncCredentials()

      const studentCard = constructorCalls.find((c) => c._id === 'studentcard-16')
      expect(studentCard?.cred_def_ids).toEqual(['ABC:3:CL:100:student_card'])
    })

    it('skips schemas already in MongoDB (no constructor calls)', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: TRACTION_SCHEMA_STORAGE_RESPONSE } as any)
        .mockResolvedValueOnce({ data: TRACTION_CRED_DEF_STORAGE_RESPONSE } as any)

      // Both already exist with metadata
      mockFindById.mockResolvedValue({ _id: 'existing', schema_id: 'ABC:2:student_card:1.6', cred_def_ids: ['x'] })

      const result = await controller.syncCredentials()

      expect(constructorCalls).toHaveLength(0)
      expect(result.imported).toBe(0)
    })

    it('updates existing docs missing schema_id or cred_def_ids', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                schema_id: 'ABC:2:student_card:1.6',
                schema: { name: 'student_card', version: '1.6', attrNames: ['field'] },
              },
            ],
          },
        } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      // Exists but missing schema_id
      mockFindById.mockResolvedValue({ _id: 'student-card-16', schema_id: undefined, cred_def_ids: [] })
      mockFindByIdAndUpdate.mockResolvedValue({})

      const result = await controller.syncCredentials()

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        'studentcard-16',
        expect.objectContaining({ schema_id: 'ABC:2:student_card:1.6' }),
      )
      expect(result.updated).toBe(1)
    })

    it('handles empty Traction response', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { results: [] } } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      const result = await controller.syncCredentials()

      expect(result).toEqual({ imported: 0, updated: 0, total: 0 })
    })

    it('throws when Traction API errors', async () => {
      vi.mocked(tractionRequest.get).mockRejectedValue(new Error('Traction unavailable'))

      await expect(controller.syncCredentials()).rejects.toThrow('Traction unavailable')
    })

    it('filters by schema_name when provided', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: TRACTION_SCHEMA_STORAGE_RESPONSE } as any)
        .mockResolvedValueOnce({ data: TRACTION_CRED_DEF_STORAGE_RESPONSE } as any)

      mockFindById.mockResolvedValue(null)
      mockSave.mockResolvedValue({})

      const result = await controller.syncCredentials({ schema_name: 'student_card' })

      expect(result.total).toBe(1)
      expect(result.imported).toBe(1)
    })

    it('treats duplicate key error (11000) as already exists without throwing', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                schema_id: 'ABC:2:student_card:1.6',
                schema: { name: 'student_card', version: '1.6', attrNames: [] },
              },
            ],
          },
        } as any)
        .mockResolvedValueOnce({ data: { results: [] } } as any)

      mockFindById.mockResolvedValue(null)
      const dupError = Object.assign(new Error('dup key'), { code: 11000 })
      mockSave.mockRejectedValue(dupError)

      await expect(controller.syncCredentials()).resolves.toMatchObject({ imported: 0 })
    })
  })

  // ============================================================================
  // syncIfStale (TTL behavior)
  // ============================================================================

  describe('syncIfStale', () => {
    it('calls syncCredentials when lastSyncTimestamp is 0 (fresh start)', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } } as any)

      await controller.syncIfStale()

      expect(tractionRequest.get).toHaveBeenCalledWith('/schema-storage')
    })

    it('skips sync when called again within TTL window', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } } as any)

      await controller.syncIfStale() // first call triggers sync
      vi.clearAllMocks()
      await controller.syncIfStale() // within TTL -- should skip

      expect(tractionRequest.get).not.toHaveBeenCalled()
    })

    it('syncs again after TTL expires', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } } as any)

      await controller.syncIfStale() // first call
      vi.advanceTimersByTime(6 * 60 * 1000) // advance past 5-minute TTL
      vi.clearAllMocks()
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } } as any)

      await controller.syncIfStale() // should sync again

      expect(tractionRequest.get).toHaveBeenCalled()
    })

    it('catches sync errors and does not throw', async () => {
      vi.mocked(tractionRequest.get).mockRejectedValue(new Error('Traction down'))

      await expect(controller.syncIfStale()).resolves.toBeUndefined()
      expect(logger.warn).toHaveBeenCalled()
    })
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
