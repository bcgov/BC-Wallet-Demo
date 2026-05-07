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

import { tractionRequest } from '../../utils/tractionHelper'
import { ProofController } from '../ProofController'

describe('ProofController', () => {
  let controller: ProofController

  beforeEach(() => {
    controller = new ProofController()
    vi.clearAllMocks()
  })

  describe('getAllCredentialsByConnectionId (getProofRecord)', () => {
    it('returns the proof record data when found', async () => {
      const mockData = { presentation_exchange_id: 'pex1', state: 'verified' }
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: mockData })

      const result = await controller.getAllCredentialsByConnectionId('pex1')

      expect(result).toEqual(mockData)
      expect(tractionRequest.get).toHaveBeenCalledWith('/present-proof-2.0/records/pex1')
    })

    it('returns an empty string when the request throws', async () => {
      vi.mocked(tractionRequest.get).mockRejectedValue(new Error('Not found'))

      const result = await controller.getAllCredentialsByConnectionId('missing')

      expect(result).toBe('')
    })
  })

  describe('requestProofOOB', () => {
    it('creates a proof request then wraps it in an OOB invitation', async () => {
      const mockProof = { presentation_exchange_id: 'pex1', pres_ex_id: 'pex1' }
      const mockInvite = { invitation_url: 'https://example.com/invite' }

      vi.mocked(tractionRequest.post)
        .mockResolvedValueOnce({ data: mockProof })
        .mockResolvedValueOnce({ data: mockInvite })

      const result = await controller.requestProofOOB({ requested_attributes: {} })

      expect(tractionRequest.post).toHaveBeenNthCalledWith(1, '/present-proof-2.0/create-request', expect.any(Object))
      expect(tractionRequest.post).toHaveBeenNthCalledWith(2, '/out-of-band/create-invitation', {
        accept: ['didcomm/aip1', 'didcomm/aip2;env=rfc19'],
        alias: 'BC Wallet Showcase',
        attachments: [{ id: 'pex1', type: 'present-proof-v2' }],
        handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
        metadata: {},
        my_label: 'Proof Invitation',
        protocol_version: '1.1',
        use_public_did: true,
      })
      expect(result).toEqual({ proofUrl: 'https://example.com/invite', proof: mockProof })
    })
  })

  describe('requestProof', () => {
    it('posts to present-proof/send-request and returns data', async () => {
      const mockData = { presentation_exchange_id: 'pex2', state: 'request_sent' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })

      const result = await controller.requestProof({ connection_id: 'conn1' })

      expect(tractionRequest.post).toHaveBeenCalledWith('/present-proof-2.0/send-request', {
        connection_id: 'conn1',
      })
      expect(result).toEqual(mockData)
    })
  })

  describe('deleteProofById', () => {
    it('calls tractionRequest.delete on the correct endpoint', async () => {
      vi.mocked(tractionRequest.delete).mockResolvedValue({ data: {} })

      await controller.deleteProofById('pex1')

      expect(tractionRequest.delete).toHaveBeenCalledWith('/present-proof-2.0/records/pex1')
    })

    it('returns the deleted record data', async () => {
      const mockData = { deleted: true }
      vi.mocked(tractionRequest.delete).mockResolvedValue({ data: mockData })

      const result = await controller.deleteProofById('pex1')

      expect(result).toEqual(mockData)
    })
  })

  describe('acceptProof', () => {
    it('posts to verify-presentation and returns the result', async () => {
      const mockData = { state: 'verified', presentation_exchange_id: 'pex1' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })

      const result = await controller.acceptProof({}, 'pex1')

      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/present-proof-2.0/records/pex1/verify-presentation',
        undefined,
      )
      expect(result).toEqual(mockData)
    })
  })
})
