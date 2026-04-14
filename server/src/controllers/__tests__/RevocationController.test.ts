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
import { RevocationController } from '../RevocationController'

describe('RevocationController', () => {
  let controller: RevocationController

  beforeEach(() => {
    controller = new RevocationController()
    vi.clearAllMocks()
  })

  describe('acceptProof (revoke)', () => {
    it('posts to the revocation/revoke endpoint with the given params', async () => {
      const params = { connection_id: 'conn1', cred_rev_id: 'rev1', rev_reg_id: 'reg1' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { success: true } })

      await controller.acceptProof(params)

      expect(tractionRequest.post).toHaveBeenCalledWith('/revocation/revoke', params)
    })

    it('returns the revocation result data', async () => {
      const mockData = { success: true, thread_id: 'thread1' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })

      const result = await controller.acceptProof({ cred_rev_id: 'rev1' })

      expect(result).toEqual(mockData)
    })
  })
})
