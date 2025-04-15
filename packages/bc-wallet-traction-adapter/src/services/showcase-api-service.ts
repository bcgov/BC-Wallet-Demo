import {
  Configuration,
  type ConfigurationParameters,
  CredentialDefinitionRequest,
  CredentialDefinitionsApi,
  CredentialSchemaRequest,
} from 'bc-wallet-openapi'

import { ApiService } from './api-service'

export class ShowcaseApiService extends ApiService {
  private readonly config: Configuration
  private readonly configOptions: ConfigurationParameters
  private readonly credentialDefinitionsApi: CredentialDefinitionsApi

  public constructor(private apiBasePath: string) {
    super()

    this.configOptions = {
      basePath: this.apiBasePath,
    }
    this.config = new Configuration(this.configOptions)
    this.credentialDefinitionsApi = new CredentialDefinitionsApi(this.config)
  }

  public async updateCredentialSchemaIdentifier(id: string, identifier: string) {
    const response = await this.credentialDefinitionsApi.getCredentialSchemaRaw({ credentialSchema: id })
    const existingSchema = await this.handleApiResponse(response)
    if (!existingSchema || !existingSchema.credentialSchema) {
      return Promise.reject(`No schema is was returned for id ${id}`)
    }

    this.credentialDefinitionsApi.updateCredentialSchema({
      credentialSchema: id,
      credentialSchemaRequest: {
        name: existingSchema.credentialSchema.name,
        version: existingSchema.credentialSchema.version,
        identifierType: 'DID',
        identifier,
        source: existingSchema.credentialSchema.source,
      } satisfies CredentialSchemaRequest,
    })
  }

  public async updateCredentialDefIdentifier(id: string, identifier: string) {
    const response = await this.credentialDefinitionsApi.getCredentialDefinitionRaw({ definitionId: id })
    const existingDefinition = await this.handleApiResponse(response)
    if (!existingDefinition || !existingDefinition.credentialDefinition) {
      return Promise.reject(`No definition is was returned for id ${id}`)
    }

    this.credentialDefinitionsApi.updateCredentialDefinition({
      definitionId: id,
      credentialDefinitionRequest: {
        name: existingDefinition.credentialDefinition.name,
        version: existingDefinition.credentialDefinition.version,
        identifierType: 'DID',
        identifier,
        type: existingDefinition.credentialDefinition.type,
        credentialSchema: existingDefinition.credentialDefinition.credentialSchema.id,
      } satisfies CredentialDefinitionRequest,
    })
  }

  public updateBearerToken(token: string): void {
    this.configOptions.accessToken = this.tokenCallback(token)
  }

  private tokenCallback(token: string): (name?: string, scopes?: string[]) => string {
    return (name?: string, scopes?: string[]): string => {
      if (name === 'Authorization') {
        return `Bearer ${token}`
      }
      return ''
    }
  }
}
