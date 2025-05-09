import type { CredentialDefinitionImportRequest, Issuer } from 'bc-wallet-openapi'

export interface IAdapterClientApi {
  publishIssuer(issuer: Issuer, options: SendOptions): Promise<void>
  importCredentialSchema(importRequest: CredentialDefinitionImportRequest, options: SendOptions): Promise<void>
  importCredentialDefinition(
    credentialDefinition: CredentialDefinitionImportRequest,
    options: SendOptions,
  ): Promise<void>

  close(): Promise<void>
}

export type SendOptions = {
  authHeader?: string
  walletId?: string
  showcaseApiUrlBase?: string
  tractionApiUrlBase?: string
  tractionTenantId?: string
}
