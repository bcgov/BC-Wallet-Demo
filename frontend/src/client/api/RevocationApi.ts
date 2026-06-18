import { apiCall } from './BaseUrl'

export interface IssuedCredential {
  credExId: string
  status: 'issued' | 'revoked'
  credentialId?: string
}

export const getRevocations = async (connectionId: string): Promise<IssuedCredential[]> => {
  const res = await apiCall.get(`/demo/revocations?connection_id=${connectionId}`)
  return (res.data as any[]).map((doc) => ({
    credExId: doc._id,
    status: doc.status,
    credentialId: doc.credential_id,
  }))
}

export const revokeCredential = (credExId: string) => apiCall.post('/demo/revocations', { cred_ex_id: credExId })
