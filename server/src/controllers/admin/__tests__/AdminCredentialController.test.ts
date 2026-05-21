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

import logger from '../../../utils/logger'
import { tractionRequest } from '../../../utils/tractionHelper'
import { AdminCredentialController } from '../AdminCredentialController'

/** Helper: run syncCredentials while advancing fake timers to resolve the 5s ledger wait. */
async function syncWithTimerAdvance(controller: AdminCredentialController) {
  const promise = controller.syncCredentials()
  // Advance past the 5s ledger propagation delay (may fire multiple times)
  await vi.advanceTimersByTimeAsync(10_000)
  return promise
}

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
  // syncCredentials
  // ============================================================================

  describe('syncCredentials', () => {
    it('creates schema and cred def for credential missing both', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'student-card-16',
            name: 'student_card',
            version: '1.6',
            attributes: [
              { name: 'first_name', value: '' },
              { name: 'last_name', value: '' },
            ],
          },
        ]),
      })

      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { schema_ids: [] } } as any)
        .mockResolvedValueOnce({ data: { credential_definition_ids: [] } } as any)

      vi.mocked(tractionRequest.post)
        .mockResolvedValueOnce({ data: { sent: { schema_id: 'ABC:2:student_card:1.6' } } } as any)
        .mockResolvedValueOnce({ data: { sent: { credential_definition_id: 'ABC:3:CL:100:student_card' } } } as any)

      mockFindByIdAndUpdate.mockResolvedValue({})

      const result = await syncWithTimerAdvance(controller)

      expect(result.updated).toBe(1)
      expect(result.total).toBe(1)

      // Schema created with correct attributes
      expect(tractionRequest.post).toHaveBeenCalledWith('/schemas', {
        attributes: ['first_name', 'last_name'],
        schema_name: 'student_card',
        schema_version: '1.6',
      })

      // Cred def created
      expect(tractionRequest.post).toHaveBeenCalledWith('/credential-definitions', {
        revocation_registry_size: 25,
        schema_id: 'ABC:2:student_card:1.6',
        support_revocation: true,
        tag: 'student_card',
      })

      // Local doc updated
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('student-card-16', {
        schema_id: 'ABC:2:student_card:1.6',
        cred_def_ids: ['ABC:3:CL:100:student_card'],
      })
    })

    it('reuses existing schema from Traction when one exists', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'student-card-16',
            name: 'student_card',
            version: '1.6',
            attributes: [{ name: 'field', value: '' }],
          },
        ]),
      })

      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { schema_ids: ['ABC:2:student_card:1.6'] } } as any)
        .mockResolvedValueOnce({ data: { credential_definition_ids: ['ABC:3:CL:100:student_card'] } } as any)

      mockFindByIdAndUpdate.mockResolvedValue({})

      const result = await controller.syncCredentials()

      expect(result.updated).toBe(1)
      expect(tractionRequest.post).not.toHaveBeenCalled()
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('student-card-16', {
        schema_id: 'ABC:2:student_card:1.6',
        cred_def_ids: ['ABC:3:CL:100:student_card'],
      })
    })

    it('only updates cred_def_ids when schema_id already set', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'student-card-16',
            name: 'student_card',
            version: '1.6',
            attributes: [{ name: 'field', value: '' }],
            schema_id: 'ABC:2:student_card:1.6',
            cred_def_ids: [],
          },
        ]),
      })

      vi.mocked(tractionRequest.get).mockResolvedValueOnce({
        data: { credential_definition_ids: ['ABC:3:CL:100:student_card'] },
      } as any)

      mockFindByIdAndUpdate.mockResolvedValue({})

      const result = await controller.syncCredentials()

      expect(result.updated).toBe(1)
      expect(tractionRequest.get).toHaveBeenCalledTimes(1)
      expect(tractionRequest.get).toHaveBeenCalledWith('/credential-definitions/created', {
        params: { schema_id: 'ABC:2:student_card:1.6' },
      })
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith('student-card-16', {
        cred_def_ids: ['ABC:3:CL:100:student_card'],
      })
    })

    it('skips credentials that already have schema_id and cred_def_ids', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      })

      const result = await controller.syncCredentials()

      expect(result.updated).toBe(0)
      expect(result.total).toBe(0)
      expect(tractionRequest.get).not.toHaveBeenCalled()
    })

    it('counts failures without throwing when Traction API errors', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'student-card-16',
            name: 'student_card',
            version: '1.6',
            attributes: [],
          },
        ]),
      })

      vi.mocked(tractionRequest.get).mockRejectedValue(new Error('Traction unavailable'))

      const result = await controller.syncCredentials()

      expect(result.failed).toBe(1)
      expect(result.updated).toBe(0)
      expect(result.total).toBe(1)
    })

    it('handles multiple credentials needing sync', async () => {
      mockFind.mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'student-card-16',
            name: 'student_card',
            version: '1.6',
            attributes: [{ name: 'field', value: '' }],
          },
          {
            _id: 'member-card-154',
            name: 'member_card',
            version: '1.54',
            attributes: [{ name: 'name', value: '' }],
          },
        ]),
      })

      // Route by URL + params so responses are order-independent (credentials run in parallel)
      vi.mocked(tractionRequest.get).mockImplementation(async (url: string, config?: any) => {
        if (url === '/schemas/created') {
          const name = config?.params?.schema_name
          if (name === 'student_card') return { data: { schema_ids: ['ABC:2:student_card:1.6'] } } as any
          if (name === 'member_card') return { data: { schema_ids: ['ABC:2:member_card:1.54'] } } as any
        }
        if (url === '/credential-definitions/created') {
          const id = config?.params?.schema_id
          if (id === 'ABC:2:student_card:1.6')
            return { data: { credential_definition_ids: ['ABC:3:CL:100:student_card'] } } as any
          if (id === 'ABC:2:member_card:1.54')
            return { data: { credential_definition_ids: ['ABC:3:CL:200:member_card'] } } as any
        }
      })

      mockFindByIdAndUpdate.mockResolvedValue({})

      const result = await controller.syncCredentials()

      expect(result.updated).toBe(2)
      expect(result.total).toBe(2)
    })
  })

  // ============================================================================
  // syncIfStale (TTL behavior)
  // ============================================================================

  describe('syncIfStale', () => {
    it('calls syncCredentials when lastSyncTimestamp is 0 (fresh start)', async () => {
      mockFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })

      await controller.syncIfStale()

      expect(mockFind).toHaveBeenCalled()
    })

    it('skips sync when called again within TTL window', async () => {
      mockFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })

      await controller.syncIfStale() // first call triggers sync
      vi.resetAllMocks()
      await controller.syncIfStale() // within TTL -- should skip

      expect(mockFind).not.toHaveBeenCalled()
    })

    it('syncs again after TTL expires', async () => {
      mockFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })

      await controller.syncIfStale() // first call
      vi.advanceTimersByTime(6 * 60 * 1000) // advance past 5-minute TTL
      vi.resetAllMocks()
      mockFind.mockReturnValue({ lean: vi.fn().mockResolvedValue([]) })

      await controller.syncIfStale() // should sync again

      expect(mockFind).toHaveBeenCalled()
    })

    it('catches sync errors and does not throw', async () => {
      mockFind.mockImplementation(() => {
        throw new Error('DB down')
      })

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
