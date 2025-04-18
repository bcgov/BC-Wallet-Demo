import {
  CredentialAttributeRequest,
  CredentialAttributeType,
  type CredentialDefinition,
  CredentialSchema,
  Issuer,
} from 'bc-wallet-openapi'
import type {
  ApiResponse,
  ConfigurationParameters,
  CreateWalletTokenRequest,
  CreateWalletTokenResponse,
  DIDResult,
  TransactionRecord,
  TxnOrCredentialDefinitionSendResult,
  TxnOrSchemaSendResult,
} from 'bc-wallet-traction-openapi'
import {
  Configuration,
  CredentialDefinitionApi,
  CredentialDefinitionStorageApi,
  type CustomCreateWalletTokenRequest,
  EndorseTransactionApi,
  MultitenancyApi,
  ResponseError,
  SchemaApi,
  SchemaStorageApi,
  WalletApi,
} from 'bc-wallet-traction-openapi'

import { environment } from '../environment'
import {
  credentialDefinitionToCredentialDefinitionSendRequest,
  credentialSchemaToSchemaPostRequest,
} from '../mappers/credential-definition'
import type { CreateSchemaResult, PublishCredentialDefinitionResult } from '../types'
import { ApiService } from './api-service'
import { ShowcaseApiService } from './showcase-api-service'

/**
 * Service for interacting with the Traction API for credential issuance operations
 * Handles schema and credential definition creation, transaction management, and endorsement
 */

const TRANSACTION_TERMINAL_STATES = new Set([
  'transaction_acked',
  'transaction_completed',
  'transaction_refused',
  'transaction_cancelled',
])
const TRANSACTION_ERROR_STATES = new Set(['transaction_refused', 'transaction_cancelled'])
const TX_DELAY_MS = 2000

export type UpdateBearerTokens = {
  tractionToken?: string
  showcaseApiToken?: string
}

export class TractionService extends ApiService {
  private readonly config: Configuration
  private readonly configOptions: ConfigurationParameters
  private multitenancyApi: MultitenancyApi
  private credentialDefApi: CredentialDefinitionApi
  private credentialDefStorageApi: CredentialDefinitionStorageApi
  private schemaApi: SchemaApi
  private schemaStorageApi: SchemaStorageApi
  private walletApi: WalletApi
  private endorseTransactionApi: EndorseTransactionApi

  /**
   * Creates a new instance of the TractionService
   * @param tenantId The ID of the tenant to use for API calls
   * @param basePath The base path for the Traction API (defaults to environment settings)
   * @param showcaseApiService The showcase API service to use for schema and credential definition updates
   * @param walletId Optional wallet ID for subwallet operations
   */
  public constructor(
    private tenantId: string,
    private basePath: string = environment.traction.DEFAULT_API_BASE_PATH,
    private showcaseApiService: ShowcaseApiService,
    private walletId?: string,
    //    private accessToken?: string, TODO as long as we cannot get Traction to accept the user's bearer token we need to create one here
  ) {
    super()

    // Create a shared configuration for this tenant
    this.configOptions = {
      basePath: this.basePath,
      //      ...(this.accessToken && { apiKey: this.tokenCallback(this.accessToken) }), // Probably an error in the generated code, it's mapping apiKey not accessToken
    }
    this.config = new Configuration(this.configOptions)

    // Initialize APIs with shared config
    this.credentialDefApi = new CredentialDefinitionApi(this.config)
    this.credentialDefStorageApi = new CredentialDefinitionStorageApi(this.config)
    this.multitenancyApi = new MultitenancyApi(this.config)
    this.schemaApi = new SchemaApi(this.config)
    this.schemaStorageApi = new SchemaStorageApi(this.config)
    this.walletApi = new WalletApi(this.config)
    this.endorseTransactionApi = new EndorseTransactionApi(this.config)

    this.showcaseApiService = showcaseApiService
  }

  /**
   * Checks if the service has a bearer token configured
   * @returns True if a bearer token is available, false otherwise
   */
  public hasBearerToken(): boolean {
    return this.configOptions.apiKey !== undefined
  }

  /**
   * Updates the bearer tokens used for authorization
   * @param args
   */
  public updateBearerTokens(args: UpdateBearerTokens): void {
    if (args.tractionToken) {
      this.configOptions.apiKey = this.tokenCallback(args.tractionToken)
    }
    if (args.showcaseApiToken) {
      this.showcaseApiService.updateBearerToken(args.showcaseApiToken)
    }
  }

  /**
   * Creates a token callback function for API authorization
   * @param token The token to use for authorization
   * @returns A callback function that provides the token for the specified header
   */
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
   * @returns The schema ID if found, otherwise undefined
   */
  public async findExistingSchema(name: string, version: string): Promise<string | undefined> {
    try {
      const schemaList = await this.schemaStorageApi.schemaStorageGet()
      if (schemaList.results) {
        for (const result of schemaList.results) {
          const schema = result.schema as any
          if (result.schema && schema.name === name && schema.version === version) {
            return result.schemaId
          }
        }
      }
      return undefined
    } catch (error) {
      return this.handleServiceError(error, 'checking if schema exists')
    }
  }

  /**
   * Creates a schema from a credential schema definition
   * @param credentialSchema The credential schema definition to create a schema from
   * @returns An object containing the created schema ID and transaction ID (if any)
   */
  public async createSchema(credentialSchema: CredentialSchema): Promise<CreateSchemaResult> {
    const schemaRequest = credentialSchemaToSchemaPostRequest(credentialSchema)

    let apiResponse: ApiResponse<TxnOrSchemaSendResult>
    try {
      apiResponse = await this.schemaApi.schemasPostRaw({
        body: schemaRequest,
        createTransactionForEndorser: true, // Assuming endorsement is potentially needed
      })
    } catch (error) {
      return this.handleServiceError(error, 'posting schema')
    }

    const result = await this.handleApiResponse<TxnOrSchemaSendResult>(apiResponse)

    if (result.txn?.state) {
      console.log('Schema creation transaction state:', result.txn.state)
    }

    let schemaId = result?.sent?.schemaId
    if (!schemaId) {
      return Promise.reject(Error('No schema ID was returned after creation request'))
    }

    const transactionId = result?.txn?.transactionId

    void (await this.showcaseApiService.updateCredentialSchemaIdentifier(credentialSchema.id, schemaId))
    return { schemaId, transactionId }
  }

  /**
   * Imports an existing credential schema from the ledger
   * @param credentialSchema The credential schema to import
   * @returns A promise that resolves when the import is complete
   */
  public async importCredentialSchema(credentialSchema: CredentialSchema): Promise<void> {
    const schemaId = credentialSchema.identifier
    if (!schemaId) {
      return Promise.reject(Error(`Cannot import schema ${credentialSchema.id} without identifier`))
    }
    const record = await this.schemaStorageApi.schemaStoragePost({ body: { schemaId } })

    const rawAttrs = (record.schema as any)?.attrNames
    if (!Array.isArray(rawAttrs)) {
      return Promise.reject(Error(`Invalid schema returned for ${schemaId}`))
    }
    const attrs: CredentialAttributeRequest[] = rawAttrs.map((name) => {
      if (typeof name !== 'string') throw new Error(`Invalid attribute name for ${schemaId}: ${name}`)
      return {
        name,
        type: name.endsWith('_dateint') ? CredentialAttributeType.Date : CredentialAttributeType.String,
        value: '',
      }
    })

    await this.showcaseApiService.updateCredentialSchema(credentialSchema.id, attrs)
  }

  /**
   * Creates a credential definition
   * @param credentialDef The credential definition metadata
   * @param schemaId The schema ID to base the credential definition on
   * @param issuerDid The DID of the issuer
   * @returns An object containing the created credential definition ID and transaction ID (if any)
   */
  public async createCredentialDefinition(
    credentialDef: CredentialDefinition,
    schemaId: string,
    issuerDid: string,
  ): Promise<PublishCredentialDefinitionResult> {
    let apiResponse: ApiResponse<TxnOrCredentialDefinitionSendResult>
    try {
      apiResponse = await this.credentialDefApi.credentialDefinitionsPostRaw({
        body: credentialDefinitionToCredentialDefinitionSendRequest(credentialDef, schemaId, issuerDid),
        createTransactionForEndorser: true, // Assuming endorsement is potentially needed
      })
    } catch (error) {
      return this.handleServiceError(error, 'posting credential definition')
    }

    const result = await this.handleApiResponse<TxnOrCredentialDefinitionSendResult>(apiResponse)

    const identifier = result.sent?.credentialDefinitionId
    const transactionId = result.txn?.transactionId

    if (transactionId) {
      console.log('Credential definition transaction state:', result.txn?.state)
      console.log('Created credential definition transaction:', transactionId)
    } else if (identifier) {
      console.log('Created credential definition directly:', identifier)
    } else {
      return Promise.reject(Error('No credential definition ID or transaction ID was returned'))
    }

    if (!identifier) {
      return Promise.reject(`Created credential definition ${credentialDef.id}, but no identifier was returned`)
    }
    void (await this.showcaseApiService.updateCredentialDefIdentifier(credentialDef.id, identifier))
    return { credentialDefinitionId: identifier, transactionId }
  }

  /**
   * Checks if a credential definition with the given schema ID and tag exists
   * @param dbCredentialDef The credential definition to check for
   * @returns The credential definition ID if found, otherwise undefined
   */
  public async findExistingCredentialDefinition(dbCredentialDef: CredentialDefinition): Promise<string | undefined> {
    if (dbCredentialDef.identifier) {
      return dbCredentialDef.identifier
    }

    let schemaId = dbCredentialDef.credentialSchema.identifier
    if (!schemaId) {
      try {
        schemaId = await this.findExistingSchema(
          dbCredentialDef.credentialSchema.name,
          dbCredentialDef.credentialSchema.version,
        )
      } catch (error) {
        return this.handleServiceError(error, `finding schema for credential definition ${dbCredentialDef.name}`)
      }
      if (!schemaId) {
        console.warn(
          `Schema not found for credential definition ${dbCredentialDef.name} v${dbCredentialDef.version}, cannot find existing cred def`,
        )
        return undefined
      }
    }

    try {
      const credentialDefList = await this.credentialDefStorageApi.credentialDefinitionStorageGet()
      if (credentialDefList.results) {
        for (const result of credentialDefList.results) {
          // Match based on schemaId and tag (version) TODO improve equality check in the future
          if (result.schemaId === schemaId && result.tag === dbCredentialDef.version) {
            return result.credDefId
          }
        }
      }

      return undefined
    } catch (error) {
      return this.handleServiceError(error, 'checking if credential definition exists')
    }
  }

  /**
   * Publishes schemas and credential definitions for an issuer if they don't already exist.
   * Only publishes approved credential definitions and their referenced schemas.
   * @param issuer The issuer object containing schemas and definitions
   * @returns A promise resolving to an array of transaction IDs created during the process
   */
  public async publishIssuerAssets(issuer: Issuer): Promise<string[]> {
    const transactionIds: string[] = []
    const issuerId = await this.getIssuerDID() // Throws if not issuer
    const schemaIdMap = new Map<string, string>() // Maps internal schema ID to ledger schema ID
    const { schemas, credentialDefs } = this.filterApprovedIssuerAssets(issuer)

    // 1. Publish Schemas that were in approved
    if (schemas.length > 0) {
      for (const credentialSchema of schemas) {
        let schemaId: string | undefined =
          credentialSchema.identifier ??
          (await this.findExistingSchema(credentialSchema.name, credentialSchema.version))
        if (!schemaId) {
          console.log(`Schema ${credentialSchema.name} v${credentialSchema.version} not found, creating...`)
          const createResult = await this.createSchema(credentialSchema)
          schemaId = createResult.schemaId
          if (!credentialSchema.identifier) {
            credentialSchema.identifierType = 'DID'
            credentialSchema.identifier = schemaId
          }
          if (createResult.transactionId) {
            transactionIds.push(createResult.transactionId)
          }
        } else {
          console.log(`Schema ${credentialSchema.name} v${credentialSchema.version} found: ${schemaId}`)
          if (!credentialSchema.identifier) {
            credentialSchema.identifierType = 'DID'
            credentialSchema.identifier = schemaId
            void (await this.showcaseApiService.updateCredentialSchemaIdentifier(credentialSchema.id, schemaId))
          }
        }
        // Map internal ID (if used) or name+version to the ledger schema ID
        schemaIdMap.set(credentialSchema.id ?? `${credentialSchema.name}::${credentialSchema.version}`, schemaId)
      }
    }

    // 2. Publish Credential Definitions
    if (credentialDefs.length > 0) {
      if (transactionIds.length > 0) {
        await this.waitForTransactionsToComplete(transactionIds)
      }
      for (const credentialDef of credentialDefs) {
        let credDefId = await this.findExistingCredentialDefinition(credentialDef)

        if (!credDefId) {
          console.log(`Credential Definition ${credentialDef.name} v${credentialDef.version} not found, creating...`)
          // Determine the schema ID for this cred def
          const cdSchemaId =
            credentialDef.credentialSchema.identifier ??
            schemaIdMap.get(
              credentialDef.credentialSchema.id ??
                `${credentialDef.credentialSchema.name}::${credentialDef.credentialSchema.version}`,
            )
          if (!cdSchemaId) {
            return Promise.reject(
              Error(
                `Failed to find schema ID for cred def ${credentialDef.id} / ${credentialDef.name} version ${credentialDef.version}`,
              ),
            )
          }

          // Create new credential definition
          const createResult = await this.createCredentialDefinition(credentialDef, cdSchemaId, issuerId)
          credDefId = createResult.credentialDefinitionId // May be undefined if only transactionId is returned
          if (createResult.transactionId) {
            transactionIds.push(createResult.transactionId)
          }
          // Update local object with identifier if created directly or once transaction completes (outside this function)
          if (credDefId && !credentialDef.identifier) {
            credentialDef.identifierType = 'DID'
            credentialDef.identifier = credDefId
          }
        } else {
          console.log(`Credential Definition ${credentialDef.name} v${credentialDef.version} found: ${credDefId}`)
          // Ensure identifier is set if it wasn't originally
          if (!credentialDef.identifier) {
            credentialDef.identifierType = 'DID'
            credentialDef.identifier = credDefId
            void (await this.showcaseApiService.updateCredentialDefIdentifier(credentialDef.id, credDefId))
          }
        }
      }
    }
    return transactionIds
  }

  /**
   * Filters issuer assets to only include approved credential definitions
   * and their referenced schemas
   * @param issuer The issuer object containing schemas and definitions
   * @returns Object containing filtered schemas and definitions
   */
  private filterApprovedIssuerAssets(issuer: Issuer): {
    schemas: CredentialSchema[]
    credentialDefs: CredentialDefinition[]
  } {
    // Filter credential definitions that are approved
    const approvedDefinitions = issuer.credentialDefinitions?.filter((def) => def.approvedBy) || []

    const approvedSchemaIds = new Set<string>()
    approvedDefinitions.forEach((def) => {
      const schemaRef = def.credentialSchema.id || `${def.credentialSchema.name}::${def.credentialSchema.version}`
      approvedSchemaIds.add(schemaRef)
    })

    // Filter schemas to only include those referenced by approved definitions
    const referencedSchemas =
      issuer.credentialSchemas?.filter((schema) => {
        const schemaRef = schema.id || `${schema.name}::${schema.version}`
        return approvedSchemaIds.has(schemaRef)
      }) || []

    return {
      schemas: referencedSchemas,
      credentialDefs: approvedDefinitions,
    }
  }

  /**
   * Gets the public DID for the current issuer
   * @returns The issuer's DID
   * @throws Error if the tenant is not registered as an issuer or has no public DID
   */
  public async getIssuerDID(): Promise<string> {
    const apiResponse = await this.walletApi.walletDidPublicGetRaw()
    const result = await this.handleApiResponse<DIDResult>(apiResponse)

    if (!result.result?.did) {
      return Promise.reject(
        Error(
          `Public issuer DID not present. Tenant ${this.tenantId} may not be registered as an issuer or has no public DID.`,
        ),
      )
    }

    return result.result.did
  }

  /**
   * Gets a tenant token for the current tenant
   * @param apiKey The API key to use for authentication
   * @param walletKey Optional wallet key for unmanaged wallets
   * @returns The tenant token
   */
  public async getTenantToken(apiKey: string, walletKey?: string): Promise<string> {
    if (!this.tenantId) {
      return Promise.reject(Error('In order to get a tenant token, tenantId must be set'))
    }
    // Use CustomCreateWalletTokenRequest for potential future properties, ensure required ones are present
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

  /**
   * Gets a token for a sub-wallet
   * @param walletKey The wallet key to use for authentication
   * @returns The wallet token
   */
  public async getSubWalletToken(walletKey: string): Promise<string> {
    if (!this.walletId) {
      return Promise.reject(Error('In order to get a wallet token, walletId must be set'))
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

  /**
   * Polls the status of given transaction IDs until they reach a terminal state.
   * @param transactionIds Array of transaction IDs to monitor
   * @param pollIntervalMs Interval between status checks in milliseconds
   * @param timeoutMs Maximum time to wait for all transactions in milliseconds
   * @returns A Promise resolving to a Map mapping transaction IDs to their final states
   */
  public async waitForTransactionsToComplete(
    transactionIds: string[],
    pollIntervalMs = TX_DELAY_MS,
    timeoutMs = 120000, // 2 minutes timeout
  ): Promise<Map<string, string>> {
    if (!transactionIds?.length) {
      return new Map<string, string>()
    }

    const transactionStates = new Map<string, string>()
    const pendingTransactionIds = new Set<string>(transactionIds)
    const startTime = Date.now()

    while (pendingTransactionIds.size > 0) {
      // Check for timeout
      if (Date.now() - startTime > timeoutMs) {
        return Promise.reject(
          Error(
            `Timeout waiting for transactions after ${timeoutMs}ms. Pending: ${Array.from(pendingTransactionIds).join(', ')}`,
          ),
        )
      }

      for (const tranId of Array.from(pendingTransactionIds)) {
        try {
          const apiResponse = await this.endorseTransactionApi.transactionsTranIdGetRaw({ tranId })
          const transactionRecord = await this.handleApiResponse<TransactionRecord>(apiResponse)

          const state = transactionRecord.state
          console.debug(`Transaction ${tranId} state: ${state}`)

          if (state && TRANSACTION_TERMINAL_STATES.has(state)) {
            transactionStates.set(tranId, state)

            if (transactionRecord.updatedAt) {
              const updatedAtDate = new Date(transactionRecord.updatedAt)
              const now = new Date()
              const timeSinceUpdate = now.getTime() - updatedAtDate.getTime()

              if (timeSinceUpdate < TX_DELAY_MS) {
                // TODO after the transaction is acked, it's not available immediately. I do not know how long this could take in real life
                console.debug(`Transaction ${tranId} was updated less than ${TX_DELAY_MS}ms ago. Skipping this cycle.`)
                continue
              }
            }

            pendingTransactionIds.delete(tranId)
            if (TRANSACTION_ERROR_STATES.has(state)) {
              console.warn(`Transaction ${tranId} reached failure state: ${state}`)
              return Promise.reject(Error(`Transaction ${tranId} failed with state: ${state}`))
            }
          } else if (!state) {
            console.debug(`Transaction ${tranId} has no state information. Assuming pending.`)
          }
        } catch (error) {
          console.error(`Error fetching status for transaction ${tranId}:`, error)
          if (error instanceof ResponseError && error.response.status === 404) {
            console.error(`Transaction ${tranId} not found. Removing from pending list.`)
            transactionStates.set(tranId, 'not_found')
            pendingTransactionIds.delete(tranId)
          }
        }
      }

      if (pendingTransactionIds.size === 0) {
        console.log('All transactions reached a terminal state.')
        return transactionStates
      }

      // Wait before next polling iteration
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
    }

    return transactionStates
  }
}

/**
 * Factory function to create a new TractionService instance
 * @param apiBase The base URL for the Traction API
 * @param tenantId The tenant ID to use for operations
 * @param showcaseApiService The showcase API service to use
 * @param walletId Optional wallet ID for subwallet operations
 * @returns A new TractionService instance
 */
export function createTractionService(
  apiBase: string,
  tenantId: string,
  showcaseApiService: ShowcaseApiService,
  walletId?: string,
): TractionService {
  return new TractionService(tenantId, apiBase, showcaseApiService, walletId)
}
