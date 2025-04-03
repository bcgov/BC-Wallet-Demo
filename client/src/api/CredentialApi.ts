import type { Credential } from '../slices/types'
import type { AxiosResponse } from 'axios'

import { apiCall } from './BaseUrl'

export const issueCredential = async (
  connectionId: string,
  cred: Credential,
  credDefId: string
): Promise<AxiosResponse> => {
  return apiCall.post(`/demo/credentials/offerCredential`, {
    connection_id: connectionId,
    cred_def_id: credDefId,
    credential_proposal: {
      '@type': 'issue-credential/1.0/credential-preview',
      attributes: cred.attributes,
    },
  })
}

export const issueDeepCredential = async (
  connectionId: string,
  cred: Credential,
  credDefId: string
): Promise<AxiosResponse> => {
  return apiCall.post(`/demo/deeplink/offerCredential`, {
    connection_id: connectionId,
    cred_def_id: credDefId,
    credential_proposal: {
      '@type': 'issue-credential/1.0/credential-preview',
      attributes: cred.attributes,
    },
  })
}

export const getOrCreateCredDefId = async (credential: Credential) => {
  return apiCall.post(`/demo/credentials/getOrCreateCredDef`, credential)
}

export const getDemoCredentialsByConnectionId = async (connectionId: string) => {
  return apiCall.get(`/demo/credentials/connId/${connectionId}`)
}

export const getCredentialById = (credentialId: string): Promise<AxiosResponse> => {
  return apiCall.get(`/demo/credentials/${credentialId}`)
}

export const deleteCredentialById = (credentialId: string): Promise<AxiosResponse> => {
  return apiCall.delete(`/demo/credentials/${credentialId}`)
}
