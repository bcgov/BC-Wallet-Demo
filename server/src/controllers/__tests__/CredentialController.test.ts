import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/tractionHelper', () => ({
  tractionRequest: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../db/models/Credential', () => ({
  CredentialModel: {
    find: vi.fn(),
    findById: vi.fn(),
  },
}))

import { CredentialModel } from '../../db/models/Credential'
import { tractionRequest } from '../../utils/tractionHelper'
import { CredentialController } from '../CredentialController'

describe('CredentialController', () => {
  let controller: CredentialController

  beforeEach(() => {
    controller = new CredentialController()
    vi.clearAllMocks()
  })

  describe('getAllCredentials', () => {
    it('includes schema_id, cred_def_ids, status when present', async () => {
      vi.mocked(CredentialModel.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'traction-card',
            name: 'Traction Card',
            icon: '/icon.svg',
            version: '1.0',
            attributes: [],
            schema_id: 'ABC:2:traction_card:1.0',
            cred_def_ids: ['ABC:3:CL:100:tag'],
            status: 'active',
          },
        ]),
      } as any)

      const result = await controller.getAllCredentials()

      expect(result[0]).toMatchObject({
        id: 'traction-card',
        schema_id: 'ABC:2:traction_card:1.0',
        cred_def_ids: ['ABC:3:CL:100:tag'],
        status: 'active',
      })
    })

    it('defaults cred_def_ids to [] and status to active when missing', async () => {
      vi.mocked(CredentialModel.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          {
            _id: 'legacy-card',
            name: 'Legacy Card',
            icon: '/icon.svg',
            version: '1.0',
            attributes: [],
          },
        ]),
      } as any)

      const result = await controller.getAllCredentials()

      expect(result[0].cred_def_ids).toEqual([])
      expect(result[0].status).toBe('active')
      expect(result[0].schema_id).toBeUndefined()
    })
  })

  describe('getCredentialById', () => {
    it('includes schema_id, cred_def_ids, status in response', async () => {
      vi.mocked(CredentialModel.findById).mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: 'traction-card',
          name: 'Traction Card',
          icon: '/icon.svg',
          version: '1.0',
          attributes: [],
          schema_id: 'ABC:2:traction_card:1.0',
          cred_def_ids: ['ABC:3:CL:100:tag'],
          status: 'retired',
        }),
      } as any)

      const result = await controller.getCredentialById('traction-card')

      expect(result).toMatchObject({
        schema_id: 'ABC:2:traction_card:1.0',
        cred_def_ids: ['ABC:3:CL:100:tag'],
        status: 'retired',
      })
    })
  })

  describe('getCredByConnId', () => {
    it('calls tractionRequest.get with connection_id as a query param', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } })

      await controller.getCredByConnId('conn1')

      expect(tractionRequest.get).toHaveBeenCalledWith(
        '/issue-credential/records',
        expect.objectContaining({ params: { connection_id: 'conn1' } }),
      )
    })

    it('returns the response data', async () => {
      const mockData = { results: [{ credential_exchange_id: 'cred1' }] }
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: mockData })

      const result = await controller.getCredByConnId('conn1')

      expect(result).toEqual(mockData)
    })
  })

  describe('getOrCreateCredDef — existing schema and credential definition', () => {
    const credential = {
      id: 'student-card',
      name: 'Student Card',
      version: '1.6',
      icon: '/public/student/icon.svg',
      attributes: [{ name: 'given_names', value: 'Alice' }],
    }

    it('returns the existing credDef id without creating anything', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { schema_ids: ['existing-schema-id'] } })
        .mockResolvedValueOnce({ data: { credential_definition_ids: ['existing-cred-def-id'] } })

      const result = await controller.getOrCreateCredDef(credential)

      expect(result).toBe('existing-cred-def-id')
      expect(tractionRequest.post).not.toHaveBeenCalled()
    })
  })

  describe('getOrCreateCredDef — new schema and credential definition', () => {
    const credential = {
      id: 'new-card',
      name: 'New Card',
      version: '1.0',
      icon: '/public/icon.svg',
      attributes: [{ name: 'field_one', value: 'val' }],
    }

    it('creates schema then credential definition and returns the new credDef id', async () => {
      vi.useFakeTimers()

      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { schema_ids: [] } })
        .mockResolvedValueOnce({ data: { credential_definition_ids: [] } })
      vi.mocked(tractionRequest.post)
        .mockResolvedValueOnce({ data: { sent: { schema_id: 'new-schema-id' } } })
        .mockResolvedValueOnce({ data: { sent: { credential_definition_id: 'new-cred-def-id' } } })

      const promise = controller.getOrCreateCredDef(credential)
      // advance past the 5-second ledger propagation wait
      await vi.advanceTimersByTimeAsync(5000)
      const result = await promise

      expect(result).toBe('new-cred-def-id')
      expect(tractionRequest.post).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('getOrCreateCredDef — existing schema, new credential definition', () => {
    const credential = {
      id: 'existing-schema-card',
      name: 'Existing Schema Card',
      version: '2.0',
      icon: '/icon.svg',
      attributes: [{ name: 'attr', value: 'val' }],
    }

    it('uses existing schema id and creates a new credential definition', async () => {
      vi.mocked(tractionRequest.get)
        .mockResolvedValueOnce({ data: { schema_ids: ['pre-existing-schema-id'] } })
        .mockResolvedValueOnce({ data: { credential_definition_ids: [] } })
      vi.mocked(tractionRequest.post).mockResolvedValueOnce({
        data: { sent: { credential_definition_id: 'brand-new-cred-def' } },
      })

      const result = await controller.getOrCreateCredDef(credential)

      expect(result).toBe('brand-new-cred-def')
      // schema POST should NOT have been called
      expect(tractionRequest.post).toHaveBeenCalledTimes(1)
    })
  })

  describe('offerCredential', () => {
    it('posts to the issue-credential/send endpoint with the params', async () => {
      const params = { connection_id: 'conn1', credential_preview: { attributes: [] } }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { credential_exchange_id: 'cred-exch-1' } })

      await controller.offerCredential(params)

      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/issue-credential-2.0/send-offer',
        expect.objectContaining({
          connection_id: 'conn1',
          auto_issue: true,
          auto_remove: false,
        }),
      )
    })

    it('returns the response data', async () => {
      const mockData = { credential_exchange_id: 'cred-exch-1', state: 'offer_sent' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })

      const result = await controller.offerCredential({})

      expect(result).toEqual(mockData)
    })

    it('resolves $dateint markers in credential_preview attributes before posting', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-06-15T00:00:00.000Z'))

      const params = {
        connection_id: 'conn1',
        credential_preview: {
          attributes: [
            { name: 'expiry_date', value: '$dateint:4' },
            { name: 'given_names', value: 'Alice' },
          ],
        },
      }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { credential_exchange_id: 'cred-exch-1' } })

      await controller.offerCredential(params)

      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/issue-credential-2.0/send-offer',
        expect.objectContaining({
          connection_id: 'conn1',
          credential_preview: expect.objectContaining({
            attributes: [
              { name: 'expiry_date', value: '20290615' },
              { name: 'given_names', value: 'Alice' },
            ],
          }),
          auto_issue: true,
          auto_remove: false,
        }),
      )

      vi.useRealTimers()
    })

    it('does not modify params when no $dateint markers present', async () => {
      const params = {
        connection_id: 'conn1',
        credential_preview: {
          attributes: [{ name: 'given_names', value: 'Bob' }],
        },
      }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: {} })

      await controller.offerCredential(params)

      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/issue-credential-2.0/send-offer',
        expect.objectContaining({
          connection_id: 'conn1',
          auto_issue: true,
          auto_remove: false,
        }),
      )
    })
  })
})
