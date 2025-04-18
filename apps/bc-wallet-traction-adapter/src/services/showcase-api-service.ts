import {
  Configuration,
  type ConfigurationParameters,
  CredentialAttributeRequest,
  CredentialDefinitionRequest,
  CredentialDefinitionsApi,
  CredentialSchemaRequest,
  CredentialType,
} from 'bc-wallet-openapi'
import { CredentialDefinition } from 'bc-wallet-traction-openapi'

import { ApiService } from './api-service'

/**
 * Service for interacting with the Showcase API.
 * Handles operations related to credential schemas and definitions.
 * Extends ApiService for common API functionality.
 */
export class ShowcaseApiService extends ApiService {
  private readonly config: Configuration
  private readonly configOptions: ConfigurationParameters
  private readonly credentialDefinitionsApi: CredentialDefinitionsApi

  /**
   * Constructor for ShowcaseApiService.
   * @param apiBasePath Base path for API requests
   */
  public constructor(private apiBasePath: string) {
    super()

    this.configOptions = {
      basePath: this.apiBasePath,
    }
    this.config = new Configuration(this.configOptions)
    this.credentialDefinitionsApi = new CredentialDefinitionsApi(this.config)
  }

  /**
   * Updates the identifier for a credential schema.
   * @param id ID of the credential schema to update
   * @param identifier New identifier value to set
   * @returns Promise resolving when update is complete
   * @throws Error if no schema is found for the given ID
   */
  public async updateCredentialSchemaIdentifier(id: string, identifier: string) {
    const response = await this.credentialDefinitionsApi.getCredentialSchemaRaw({ credentialSchema: id })
    const existingSchema = await this.handleApiResponse(response)
    if (!existingSchema || !existingSchema.credentialSchema) {
      return Promise.reject(`No schema is was returned for id ${id}`)
    }

    void (await this.credentialDefinitionsApi.updateCredentialSchema({
      credentialSchema: id,
      credentialSchemaRequest: {
        name: existingSchema.credentialSchema.name,
        version: existingSchema.credentialSchema.version,
        identifierType: 'DID',
        identifier,
        source: existingSchema.credentialSchema.source,
        attributes: existingSchema.credentialSchema.attributes as Array<CredentialAttributeRequest>,
      } satisfies CredentialSchemaRequest,
    }))
  }

  /**
   * Updates the identifier for a credential definition.
   * @param id ID of the credential definition to update
   * @param identifier New identifier value to set
   * @returns Promise resolving when update is complete
   * @throws Error if no definition is found for the given ID
   */
  public async updateCredentialDefIdentifier(id: string, identifier: string) {
    const response = await this.credentialDefinitionsApi.getCredentialDefinitionRaw({ definitionId: id })
    const existingDefinition = await this.handleApiResponse(response)
    if (!existingDefinition || !existingDefinition.credentialDefinition) {
      return Promise.reject(`No definition is was returned for id ${id}`)
    }

    void (await this.credentialDefinitionsApi.updateCredentialDefinition({
      definitionId: id,
      credentialDefinitionRequest: {
        name: existingDefinition.credentialDefinition.name,
        version: existingDefinition.credentialDefinition.version,
        identifierType: 'DID',
        identifier,
        type: existingDefinition.credentialDefinition.type,
        credentialSchema: existingDefinition.credentialDefinition.credentialSchema.id,
      } satisfies CredentialDefinitionRequest,
    }))
  }

  /**
   * Updates the attributes of a credential schema.
   * @param id ID of the credential schema to update
   * @param newAttrs New attributes to set for the schema
   * @returns Promise resolving when update is complete
   * @throws Error if no schema is found for the given ID
   */
  public async updateCredentialSchema(id: string, newAttrs: CredentialAttributeRequest[]): Promise<void> {
    const response = await this.credentialDefinitionsApi.getCredentialSchemaRaw({ credentialSchema: id })
    const existing = await this.handleApiResponse(response)
    const schema = existing.credentialSchema
    if (!schema) {
      return Promise.reject(Error(`No schema found in Showcase for id ${id}`))
    }

    await this.credentialDefinitionsApi.updateCredentialSchema({
      credentialSchema: id,
      credentialSchemaRequest: {
        ...schema,
        attributes: newAttrs,
      },
    })
  }

  /**
   * Updates the attributes of a credential definition.
   * @param id ID of the credential definition to update
   * @param credDef Fetched CredentialDefinition
   * @returns Promise resolving when update is complete
   * @throws Error if no definition is found for the given ID
   */
  public async updateCredentialDefinition(id: string, credDef: CredentialDefinition): Promise<void> {
    const response = await this.credentialDefinitionsApi.getCredentialDefinitionRaw({ definitionId: id })
    const existing = await this.handleApiResponse(response)
    const definition = existing.credentialDefinition
    if (!definition) {
      return Promise.reject(Error(`No definition found in Showcase for id ${id}`))
    }

    const { credentialSchema, representations, revocation, icon, approvedBy, ...definitionWithoutRelations } =
      definition
    await this.credentialDefinitionsApi.updateCredentialDefinition({
      definitionId: id,
      credentialDefinitionRequest: {
        ...definitionWithoutRelations,
        credentialSchema: credDef.schemaId ?? definition.credentialSchema.id,
        ...(credDef.type &&
          Object.keys(CredentialType).includes(credDef.type as any) && {
            type: credDef.type as unknown as CredentialType, // FIXME?
          }),
        ...(credDef.tag && { version: credDef.tag }),
        ...(definition.icon && { icon: definition.icon?.id }),
        ...(approvedBy && { approvedBy: approvedBy?.id }),
      },
    }) // TODO revocation
  }

  /**
   * Updates the bearer token used for authorization.
   * @param token New token value to use
   */
  public updateBearerToken(token: string): void {
    this.configOptions.accessToken = this.tokenCallback(token)
  }

  /**
   * Creates a callback function for token-based authorization.
   * @param token The token to include in authorization headers
   * @returns Callback function that returns the appropriate authorization string
   */
  private tokenCallback(token: string): (name?: string, scopes?: string[]) => string {
    return (name?: string, scopes?: string[]): string => {
      if (name === 'Authorization' || name === 'OAuth2') {
        return `Bearer ${token}`
      }
      return ''
    }
  }
}
