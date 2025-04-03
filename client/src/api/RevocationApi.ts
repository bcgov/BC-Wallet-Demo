import type { RevocationRecord } from '../slices/types'
import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const revokeCredential = (record: RevocationRecord) => {
  return apiCall.post('/demo/revoke', {
    comment: 'Credential Revoked',
    connection_id: record.connectionId,
    cred_rev_id: record.credRevocationId,
    notify: true,
    notify_version: 'v1_0',
    publish: true,
    rev_reg_id: record.revocationRegId,
    thread_id: `indy::${record.revocationRegId}::${record.credRevocationId}`,
  })
}
