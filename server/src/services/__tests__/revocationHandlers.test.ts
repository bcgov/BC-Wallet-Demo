import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as tractionHelper from '../../utils/tractionHelper'
import { revocationHandlers } from '../revocationHandlers'

vi.mock('../../utils/tractionHelper')

describe('revocationHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('anoncreds handler', () => {
    it('calls Traction revocation endpoint with correct payload', async () => {
      const mockPost = vi.fn().mockResolvedValue({})
      vi.mocked(tractionHelper.tractionRequest).post = mockPost

      const metadata = {
        rev_reg_id: 'test-rev-reg-id',
        cred_rev_id: 'test-cred-rev-id',
        cred_def_id: 'test-cred-def-id',
      }
      const connectionId = 'test-connection-id'

      await revocationHandlers.anoncreds(metadata, connectionId)

      expect(mockPost).toHaveBeenCalledWith('/anoncreds/revocation/revoke', {
        connection_id: connectionId,
        cred_rev_id: 'test-cred-rev-id',
        rev_reg_id: 'test-rev-reg-id',
        publish: true,
        notify: true,
        notify_version: 'v1_0',
        comment: 'Credential Revoked',
        thread_id: 'indy::test-rev-reg-id::test-cred-rev-id',
      })
    })
  })
})
