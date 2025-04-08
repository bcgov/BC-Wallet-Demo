import type { CredentialDefinition } from 'bc-wallet-openapi'

export interface IAdapterClientApi {
  storeCredentialDefinition(credentialDefinition: CredentialDefinition): Promise<void>

  close(): Promise<void>
}
