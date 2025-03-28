import { CredentialSchema, Issuer } from 'bc-wallet-openapi'
import {
  AnoncredsCredentialDefinitionsApi,
  AnoncredsSchemasApi,
  ApiResponse,
  Configuration,
  ConfigurationParameters,
  CreateWalletTokenRequest,
  CreateWalletTokenResponse,
  CredDefResult,
  type CustomCreateWalletTokenRequest,
  MultitenancyApi,
  ResponseError,
  SchemaResult,
  WalletApi,
} from 'bc-wallet-traction-openapi'
import {
  credentialDefinitionToCredDefPostRequest,
  credentialSchemaToSchemaPostRequest,
  getCredDefResultToCredDefResult,
} from '../mappers/credential-definition'
import { environment } from '../environment'

export class TractionService {
  private readonly config: Configuration
  private readonly configOptions: ConfigurationParameters
  private anoncredsApi: AnoncredsCredentialDefinitionsApi
  private multitenancyApi: MultitenancyApi
  private schemasApi: AnoncredsSchemasApi
  private walletApi: WalletApi

  constructor(
    private tenantId: string,
    private basePath: string = environment.traction.DEFAULT_API_BASE_PATH,
    private walletId?: string,
    private accessToken?: string,
  ) {
    // Create a shared configuration for this tenant
    this.configOptions = {
      basePath: this.basePath,
      ...(this.accessToken && { apiKey: this.tokenCallback(this.accessToken) }), // Probably an error in the generated code, it's mapping apiKey not accessToken
    }
    this.config = new Configuration(this.configOptions)

    // Initialize APIs with shared config
    this.anoncredsApi = new AnoncredsCredentialDefinitionsApi(this.config)
    this.multitenancyApi = new MultitenancyApi(this.config)
    this.schemasApi = new AnoncredsSchemasApi(this.config)
    this.walletApi = new WalletApi(this.config)
  }

  public updateBearerToken(token: string): void {
    this.configOptions.apiKey = this.tokenCallback(token)
  }

  private tokenCallback(token: string) {
    return async (name: string) => {
      if (name === 'Authorization') {
        return `Bearer ${token}`
      }
      return ''
    }
  }

  /**
   * Checks if a schema with the given name and version exists
   * @param name The schema name
   * @param version The schema version
   * @param issuerId
   * @returns The schema ID if found, otherwise null
   */
  public async findExistingSchema(name: string, version: string, issuerId: string): Promise<string | null> {
    try {
      const response = await this.schemasApi.anoncredsSchemasGet({
        schemaName: name,
        schemaVersion: version,
        schemaIssuerId: issuerId,
      })

      if (response.schemaIds && response.schemaIds.length > 0) {
        return response.schemaIds[0]
      }
      return null
    } catch (error) {
      console.error('Error checking if schema exists:', error)
      return null
    }
  }

  /**
   * Creates a schema from a credential definition
   * @param credentialSchema The credential definition to create a schema from
   * @param issuerId
   * @returns The created schema ID
   */
  public async createSchema(credentialSchema: CredentialSchema, issuerId: string): Promise<string> {
    const schemaRequest = credentialSchemaToSchemaPostRequest(credentialSchema, issuerId)

    const apiResponse = await this.schemasApi.anoncredsSchemaPostRaw({
      body: schemaRequest,
    })

    const result = await this.handleApiResponse<SchemaResult>(apiResponse)
    if (!result?.schemaState?.schemaId) {
      return Promise.reject(Error('No schema ID was returned'))
    }

    return result.schemaState.schemaId
  }

  /**
   * Checks if a credential definition with the given schema ID and tag exists
   * @param schemaId
   * @param version The credential definition version
   * @param issuerId
   * @returns The credential definition ID if found, otherwise null
   */
  public async findExistingCredentialDefinition(schemaId: string, version: string, issuerId: string): Promise<CredDefResult | undefined> {
    try {
      const response = await this.anoncredsApi.anoncredsCredentialDefinitionsGet({
        schemaId,
        schemaVersion: version,
        issuerId,
      })

      if (response.credentialDefinitionIds && response.credentialDefinitionIds.length > 0) {
        // For each credential definition ID (which should be 1), double-check if tag matches
        for (const credDefId of response.credentialDefinitionIds) {
          try {
            const credDefResponse = await this.anoncredsApi.anoncredsCredentialDefinitionCredDefIdGet({
              credDefId,
            })

            // Check if this credential definition has the requested tag
            if (credDefResponse.credentialDefinition?.tag === version) {
              return getCredDefResultToCredDefResult(credDefResponse)
            }
          } catch (error) {
            console.error(`Error fetching credential definition ${credDefId}:`, error)
          }
        }
      }

      return undefined
    } catch (error) {
      console.error('Error checking if credential definition exists:', error)
      return undefined
    }
  }

  public async publishIssuerAssets(issuer: Issuer): Promise<void> {
    const issuerId = await this.getIssuerDID()
    const schemaIdMap = new Map<string, string>()
    if (issuer.credentialSchemas) {
      let schemaId: string | null
      for (const credentialSchema of issuer.credentialSchemas) {
        schemaId = await this.findExistingSchema(credentialSchema.name, credentialSchema.version, issuerId)
        if (!schemaId) {
          schemaId = await this.createSchema(credentialSchema, issuerId)
          schemaIdMap.set(credentialSchema.id, schemaId)
        }
      }
    }

    if (issuer.credentialDefinitions) {
      for (const credentialDef of issuer.credentialDefinitions) {
        const existingCredDef = await this.findExistingCredentialDefinition(credentialDef.id, credentialDef.version, issuerId)
        if (!existingCredDef) {
          // Create new credential definition
          const cdSchemaId = credentialDef.credentialSchema.id ?? schemaIdMap.get(credentialDef.id) // FIXME confirm if we still need schemaIdMap
          if (!cdSchemaId) {
            console.error(
              `Could not determine the schema id for credential definition ${credentialDef.id} / ${credentialDef.name} version ${credentialDef.version}`,
            )
          } else {
            const apiResponse = await this.anoncredsApi.anoncredsCredentialDefinitionPostRaw({
              body: credentialDefinitionToCredDefPostRequest(credentialDef, cdSchemaId, issuerId),
            })
            const result = await this.handleApiResponse(apiResponse)
            console.log('created credential definition', result.registrationMetadata)
          }
        }
      }
    }
  }

  public  async getIssuerDID() {
      const result = await this.walletApi.walletDidPublicGet()
      if (!result.result) {
        return Promise.reject(Error(`Public issuer DID not present. Tenant ${this.tenantId} is not registered as an issuer.`))
      }

      return result.result.did
  }

  public async getTenantToken(apiKey: string, walletKey?: string): Promise<string> {
    if (!this.tenantId) {
      return Promise.reject(Error('in order to get a tenant token, tenantId must be set'))
    }
    const request: CustomCreateWalletTokenRequest = {
      apiKey,
      walletKey, // Only required for unmanaged wallets
    }

    const apiResponse = await this.multitenancyApi.multitenancyTenantTenantIdTokenPostRaw({
      tenantId: this.tenantId,
      body: request,
    })

    const tokenResponse = await this.handleApiResponse<CreateWalletTokenResponse>(apiResponse)
    if (!tokenResponse?.token) {
      return Promise.reject(Error('no token was returned'))
    }
    return tokenResponse.token
  }

  public async getSubWalletToken(walletKey: string): Promise<string> {
    if (!this.walletId) {
      return Promise.reject(Error('in order to get a wallet token, walletId must be set'))
    }
    const request: CreateWalletTokenRequest = {
      walletKey,
    }

    const apiResponse = await this.multitenancyApi.multitenancyWalletWalletIdTokenPostRaw({
      walletId: this.walletId,
      body: request,
    })

    const tokenResponse = await this.handleApiResponse<CreateWalletTokenResponse>(apiResponse)
    if (!tokenResponse?.token) {
      return Promise.reject(Error('no token was returned'))
    }
    return tokenResponse.token
  }

  private async handleApiResponse<T>(response: ApiResponse<T>): Promise<T> {
    if (!response.raw.ok) {
      const errorText = await response.raw.text().catch(() => 'No error details available')
      throw new ResponseError(response.raw, `HTTP error! Status: ${response.raw.status}, Details: ${errorText}`)
    }
    return response.value()
  }
}

export function createTractionService(apiBase: string, tenantId: string, walletId?: string): TractionService {
  return new TractionService(tenantId, apiBase, walletId)
}
