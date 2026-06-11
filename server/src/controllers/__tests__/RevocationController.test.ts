import { BadRequestError, NotFoundError } from 'routing-controllers'
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
        _id: 'ex-123',
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

      const res = await controller.revokeCredential({ cred_ex_id: 'ex-123' }, mockReq)

      expect(mockService.revokeCredential).toHaveBeenCalledWith('ex-123')
      expect(mockSocket.emit).toHaveBeenCalledWith('revocation', {
        cred_ex_id: 'ex-123',
        status: 'revoked',
      })
      expect(res).toEqual(result)
    })

    it('throws NotFoundError when service reports credential not found', async () => {
      const mockReq = { app: { get: vi.fn().mockReturnValue(new Map()) } }
      mockService.revokeCredential.mockRejectedValue(new Error('IssuedCredential not found: ex-999'))
      await expect(controller.revokeCredential({ cred_ex_id: 'ex-999' }, mockReq)).rejects.toThrow(NotFoundError)
    })

    it('throws BadRequestError when service reports credential already revoked', async () => {
      const mockReq = { app: { get: vi.fn().mockReturnValue(new Map()) } }
      mockService.revokeCredential.mockRejectedValue(new Error('credential already revoked'))
      await expect(controller.revokeCredential({ cred_ex_id: 'ex-123' }, mockReq)).rejects.toThrow(BadRequestError)
    })

    it('does not emit socket event if no socket for connection', async () => {
      const mockSocketMap = new Map()
      const mockReq = {
        app: {
          get: vi.fn().mockReturnValue(mockSocketMap),
        },
      }

      const result = {
        _id: 'ex-123',
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

      await controller.revokeCredential({ cred_ex_id: 'ex-123' }, mockReq)

      expect(mockService.revokeCredential).toHaveBeenCalledWith('ex-123')
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
