import {
  Configuration,
  type ConfigurationParameters,
  CredentialAttributeRequest,
  CredentialDefinitionImportRequest,
  CredentialDefinitionRequest,
  CredentialDefinitionsApi,
  CredentialSchemaRequest,
  CredentialType,
  Source,
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
   * Creates a new credential schema in the api-server DB
   * @param importRequest The import request containing metadata such as name, version, identifier, and identifierType
   * @param schema The schema definition object containing schema properties and structure
   * @param newAttrs Array of credential attribute definitions specifying name, type, and default value for each attribute
   * @returns Promise resolving when schema creation is complete
   */
  public async createCredentialSchema(
    importRequest: CredentialDefinitionImportRequest,
    schema: { [key: string]: object },
    newAttrs: CredentialAttributeRequest[],
  ): Promise<void> {
    const credentialSchemaResponse = await this.credentialDefinitionsApi.createCredentialSchema({
      credentialSchemaRequest: {
        ...schema,
        ...importRequest,
        version: importRequest.version ?? '1',
        source: Source.Imported,
        attributes: newAttrs,
      },
    })
    console.debug('Credential schema created. id:', credentialSchemaResponse.credentialSchema?.id)
  }

  /**
   * Create a new credential definition based on imported one
   * @param credDefImportDefinition
   * @param remoteCredDef Fetched CredentialDefinition
   * @returns Promise resolving when update is complete
   * @returns Promise resolving when update is complete
   * @throws Error if no definition is found for the given ID
   */
  public async createCredentialDefinition(
    credDefImportDefinition: CredentialDefinitionImportRequest,
    remoteCredDef: CredentialDefinition,
  ): Promise<void> {
    if (!remoteCredDef.schemaId) {
      return Promise.reject(Error(`Cannot create a credential definition, it should have a schemaId`))
    }
    const response = await this.credentialDefinitionsApi.getCredentialSchemaRaw({
      credentialSchema: remoteCredDef.schemaId,
    })
    const existing = await this.handleApiResponse(response)
    const schema = existing.credentialSchema
    if (!schema) {
      return Promise.reject(
        Error(`No schema found in Showcase for identifier ${remoteCredDef.schemaId}. Please import it first.`),
      )
    }

    await this.credentialDefinitionsApi.createCredentialDefinition({
      credentialDefinitionRequest: {
        name: credDefImportDefinition.name,
        identifierType: credDefImportDefinition.identifierType,
        identifier: credDefImportDefinition.identifier,
        credentialSchema: schema.id,
        version: credDefImportDefinition.version ?? '1',
        type: CredentialType.Anoncred, // FIXME we do not support external types like CL yet
        /*
          remoteCredDef.type && Object.keys(CredentialType).includes(remoteCredDef.type as any)
            ? (remoteCredDef.type as unknown as CredentialType)
            : CredentialType.Anoncred,
*/
        source: Source.Imported,
        ...(remoteCredDef.tag && { version: remoteCredDef.tag }),
        ...(credDefImportDefinition.icon && { icon: credDefImportDefinition.icon }),
        ...(credDefImportDefinition.approvedBy && { approvedBy: credDefImportDefinition.approvedBy }),
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
