import type { CredentialDefinition } from 'bc-wallet-openapi'

export interface IAdapterClientApi {
  storeCredentialDefinition(credentialDefinition: CredentialDefinition): Promise<void>

  close(): Promise<void>
}

export type SendOptions = {
  authHeader?: string
  walletId?: string
  showcaseApiUrlBase?: string
  tractionApiUrlBase?: string
  tractionTenantId?: string
}
