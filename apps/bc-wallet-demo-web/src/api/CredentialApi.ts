import type { AxiosResponse } from 'axios'
import { demoBackendApi } from './BaseUrl'
import type { CredentialDefinition } from '../slices/types'

export const issueCredential = async (
    connectionId: string,
    credentialDefinition: CredentialDefinition
): Promise<AxiosResponse> => {
  return demoBackendApi.post(`/demo/credentials/offerCredential`, {
    connection_id: connectionId,
    cred_def_id: credentialDefinition.identifier,
    credential_proposal: {
      '@type': 'issue-credential/1.0/credential-preview',
      attributes: credentialDefinition.attributes,
    },
  })
}

export const issueDeepCredential = async (
    connectionId: string,
    credentialDefinition: CredentialDefinition
): Promise<AxiosResponse> => {
  return demoBackendApi.post(`/demo/deeplink/offerCredential`, {
    connection_id: connectionId,
    cred_def_id: credentialDefinition.identifier,
    credential_proposal: {
      '@type': 'issue-credential/1.0/credential-preview',
      attributes: credentialDefinition.attributes,
    },
  })
}

export const getCredentialById = (credentialId: string): Promise<AxiosResponse> => {
  return demoBackendApi.get(`/demo/credentials/${credentialId}`)
}

export const deleteCredentialById = (credentialId: string): Promise<AxiosResponse> => {
  return demoBackendApi.delete(`/demo/credentials/${credentialId}`)
}
