import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/RevocationService')
vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { RevocationController } from '../RevocationController'

describe('RevocationController', () => {
  let controller: RevocationController
  let mockService: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockService = {
      revokeCredential: vi.fn(),
      getByConnection: vi.fn(),
    }
    controller = new RevocationController(mockService)
  })

  describe('revokeCredential', () => {
    it('revokes credential and emits socket event', async () => {
      const mockSocket = { emit: vi.fn() }
      const mockSocketMap = new Map([['conn-123', mockSocket]])
      const mockReq = {
        app: {
          get: vi.fn().mockReturnValue(mockSocketMap),
        },
      }

      const result = {
        _id: 'issued-1',
        credential_id: 'cred-1',
        connection_id: 'conn-123',
        format: 'anoncreds',
        status: 'revoked',
        revoked_at: new Date(),
        format_metadata: { rev_reg_id: 'reg-1', cred_rev_id: 'rev-1' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockService.revokeCredential.mockResolvedValue(result)

      const res = await controller.revokeCredential({ credentialId: 'issued-1' }, mockReq)

      expect(mockService.revokeCredential).toHaveBeenCalledWith('issued-1')
      expect(mockSocket.emit).toHaveBeenCalledWith('revocation', {
        credentialId: 'issued-1',
        status: 'revoked',
      })
      expect(res).toEqual(result)
    })

    it('does not emit socket event if no socket for connection', async () => {
      const mockSocketMap = new Map()
      const mockReq = {
        app: {
          get: vi.fn().mockReturnValue(mockSocketMap),
        },
      }

      const result = {
        _id: 'issued-1',
        credential_id: 'cred-1',
        connection_id: 'conn-123',
        format: 'anoncreds',
        status: 'revoked',
        revoked_at: new Date(),
        format_metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockService.revokeCredential.mockResolvedValue(result)

      await controller.revokeCredential({ credentialId: 'issued-1' }, mockReq)

      expect(mockService.revokeCredential).toHaveBeenCalledWith('issued-1')
    })
  })

  describe('getRevocations', () => {
    it('returns issued credentials for connection', async () => {
      const docs = [
        {
          _id: 'issued-1',
          credential_id: 'cred-1',
          connection_id: 'conn-123',
          format: 'anoncreds',
          status: 'issued',
          revoked_at: null,
          format_metadata: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockService.getByConnection.mockResolvedValue(docs)

      const res = await controller.getRevocations('conn-123')

      expect(mockService.getByConnection).toHaveBeenCalledWith('conn-123')
      expect(res).toEqual(docs)
    })
  })
})
