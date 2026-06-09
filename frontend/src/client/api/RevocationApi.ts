import type { RevocationRecord } from '../slices/types'

import { apiCall } from './BaseUrl'

export const revokeCredential = (record: RevocationRecord) => {
  return apiCall.post('/demo/revocations', { credentialId: record.issuedCredentialId })
}
