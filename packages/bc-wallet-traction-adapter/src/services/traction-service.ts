import { type CredentialDefinition, CredentialSchema, Issuer } from 'bc-wallet-openapi'
import {
  ApiResponse,
  Configuration,
  ConfigurationParameters,
  CreateWalletTokenRequest,
  CreateWalletTokenResponse,
  CredentialDefinitionApi,
  CredentialDefinitionStorageApi,
  type CustomCreateWalletTokenRequest,
  EndorseTransactionApi,
  MultitenancyApi,
  ResponseError,
  SchemaApi,
  SchemaStorageApi,
  TransactionRecord, TxnOrCredentialDefinitionSendResult,
  TxnOrSchemaSendResult,
  WalletApi
} from 'bc-wallet-traction-openapi'
import {
  credentialDefinitionToCredentialDefinitionSendRequest,
  credentialSchemaToSchemaPostRequest,
} from '../mappers/credential-definition'
import { environment } from '../environment'

interface CreateSchemaResult {
  schemaId: string
  transactionId?: string
}

interface PublishCredentialDefinitionResult {
  credentialDefinitionId?: string
  transactionId?: string
}

const TRANSACTION_TERMINAL_STATES = new Set(['transaction_completed', 'transaction_refused', 'transaction_cancelled'])

export class TractionService {
  private readonly config: Configuration
  private readonly configOptions: ConfigurationParameters
  private multitenancyApi: MultitenancyApi
  private credentialDefApi: CredentialDefinitionApi
  private credentialDefStorageApi: CredentialDefinitionStorageApi
  private schemaApi: SchemaApi
  private schemaStorageApi: SchemaStorageApi
  private walletApi: WalletApi
  private endorseTransactionApi: EndorseTransactionApi

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
    this.credentialDefApi = new CredentialDefinitionApi(this.config)
    this.credentialDefStorageApi = new CredentialDefinitionStorageApi(this.config)
    this.multitenancyApi = new MultitenancyApi(this.config)
    this.schemaApi = new SchemaApi(this.config)
    this.schemaStorageApi = new SchemaStorageApi(this.config)
    this.walletApi = new WalletApi(this.config)
    this.endorseTransactionApi = new EndorseTransactionApi(this.config)
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
   * @returns The schema ID if found, otherwise null
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
      console.error('Error checking if schema exists:', error)
      // Propagate the error for better handling upstream
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error checking if schema exists'))
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
      console.error('Error posting schema:', error)
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error posting schema'))
    }

    const result = await this.handleApiResponse<TxnOrSchemaSendResult>(apiResponse)

    if (result.txn?.state) {
      console.log('Schema creation transaction state:', result.txn.state)
    }

    const schemaId = result?.sent?.schemaId
    if (!schemaId) {
      return Promise.reject(Error('No schema ID was returned after creation request'))
    }

    const transactionId = result?.txn?.transactionId

    return { schemaId, transactionId }
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
      console.error('Error posting credential definition:', error)
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error posting credential definition'))
    }

    const result = await this.handleApiResponse<TxnOrCredentialDefinitionSendResult>(apiResponse)

    const credentialDefinitionId = result.sent?.credentialDefinitionId
    const transactionId = result.txn?.transactionId

    if (transactionId) {
      console.log('Credential definition transaction state:', result.txn?.state)
      console.log('Created credential definition transaction:', transactionId)
    } else if (credentialDefinitionId) {
      console.log('Created credential definition directly:', credentialDefinitionId)
    } else {
      return Promise.reject(Error('No credential definition ID or transaction ID was returned'))
    }

    return { credentialDefinitionId, transactionId }
  }

  /**
   * Checks if a credential definition with the given schema ID and tag exists
   * @returns The credential definition ID if found, otherwise null
   * @param dbCredentialDef
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
        console.error(`Error finding schema for credential definition ${dbCredentialDef.name}:`, error)
        if (error instanceof Error) {
          return Promise.reject(error)
        }
        return Promise.reject(Error('Unknown error finding schema for credential definition'))
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
          // Match based on schemaId and tag (version)
          if (result.schemaId === schemaId && result.tag === dbCredentialDef.version) {
            return result.credDefId
          }
        }
      }

      return undefined
    } catch (error) {
      console.error('Error checking if credential definition exists:', error)
      // Propagate the error
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error checking if credential definition exists'))
    }
  }

  /**
   * Publishes schemas and credential definitions for an issuer if they don't already exist.
   * @param issuer The issuer object containing schemas and definitions.
   * @returns A promise resolving to an array of transaction IDs created during the process.
   */
  public async publishIssuerAssets(issuer: Issuer): Promise<string[]> {
    const transactionIds: string[] = []
    const issuerId = await this.getIssuerDID() // Throws if not issuer
    const schemaIdMap = new Map<string, string>() // Maps internal schema ID to ledger schema ID

    // 1. Publish Schemas
    if (issuer.credentialSchemas) {
      for (const credentialSchema of issuer.credentialSchemas) {
        let schemaId: string | undefined = credentialSchema.identifier ?? await this.findExistingSchema(credentialSchema.name, credentialSchema.version)
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
          }
        }
        // Map internal ID (if used) or name+version to the ledger schema ID
        schemaIdMap.set(credentialSchema.id ?? `${credentialSchema.name}::${credentialSchema.version}`, schemaId)
      }
    }

    // 2. Publish Credential Definitions
    if (issuer.credentialDefinitions) {
      for (const credentialDef of issuer.credentialDefinitions) {
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
            // This should ideally not happen if schema creation/finding logic is correct
            console.error(
              `Could not determine the schema ID for credential definition ${credentialDef.id} / ${credentialDef.name} version ${credentialDef.version}. Skipping creation.`,
            )
            // Optionally throw an error here if this is critical
            // return Promise.reject(Error(`Failed to find schema ID for cred def ${credentialDef.name}`))
            continue // Skip this cred def
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
          }
        }
      }
    }
    return transactionIds
  }

  public async getIssuerDID(): Promise<string> {
    try {
      const result = await this.walletApi.walletDidPublicGet()
      if (!result.result?.did) {
        return Promise.reject(
          Error(
            `Public issuer DID not present. Tenant ${this.tenantId} may not be registered as an issuer or has no public DID.`,
          ),
        )
      }

      return result.result.did
    } catch (error) {
      console.error('Error getting public DID:', error)
      if (error instanceof ResponseError) {
        const errorText = await error.response.text().catch(() => 'No error details available')
        return Promise.reject(Error(`Failed to get public DID: ${error.response.status} - ${errorText}`))
      }
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error getting public DID'))
    }
  }

  public async getTenantToken(apiKey: string, walletKey?: string): Promise<string> {
    if (!this.tenantId) {
      return Promise.reject(Error('In order to get a tenant token, tenantId must be set'))
    }
    // Use CustomCreateWalletTokenRequest for potential future properties, ensure required ones are present
    const request: CustomCreateWalletTokenRequest = {
      apiKey,
      walletKey, // Only required for unmanaged wallets
    }

    let apiResponse: ApiResponse<CreateWalletTokenResponse>
    try {
      apiResponse = await this.multitenancyApi.multitenancyTenantTenantIdTokenPostRaw({
        tenantId: this.tenantId,
        body: request as any, // Cast if type mismatch between Custom and expected
      })
    } catch (error) {
      console.error(`Error getting tenant token for tenant ${this.tenantId}:`, error)
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error getting tenant token'))
    }

    const tokenResponse = await this.handleApiResponse<CreateWalletTokenResponse>(apiResponse)
    if (!tokenResponse?.token) {
      return Promise.reject(Error('No token was returned for tenant'))
    }
    return tokenResponse.token
  }

  public async getSubWalletToken(walletKey: string): Promise<string> {
    if (!this.walletId) {
      return Promise.reject(Error('In order to get a wallet token, walletId must be set'))
    }
    const request: CreateWalletTokenRequest = {
      walletKey,
    }

    let apiResponse: ApiResponse<CreateWalletTokenResponse>
    try {
      apiResponse = await this.multitenancyApi.multitenancyWalletWalletIdTokenPostRaw({
        walletId: this.walletId,
        body: request,
      })
    } catch (error) {
      console.error(`Error getting sub-wallet token for wallet ${this.walletId}:`, error)
      if (error instanceof Error) {
        return Promise.reject(error)
      }
      return Promise.reject(Error('Unknown error getting sub-wallet token'))
    }

    const tokenResponse = await this.handleApiResponse<CreateWalletTokenResponse>(apiResponse)
    if (!tokenResponse?.token) {
      return Promise.reject(Error('No token was returned for sub-wallet'))
    }
    return tokenResponse.token
  }

  /**
   * Polls the status of given transaction IDs until they reach a terminal state.
   * @param transactionIds Array of transaction IDs to monitor.
   * @param pollIntervalMs Interval between status checks in milliseconds.
   * @param timeoutMs Maximum time to wait for all transactions in milliseconds.
   * @returns A Promise resolving to a Map mapping transaction IDs to their final states.
   *          Rejects if timeout is reached or an unrecoverable error occurs.
   */
  public async waitForTransactionsToComplete(
    transactionIds: string[],
    pollIntervalMs = 3000,
    timeoutMs = 120000, // 2 minutes timeout
  ): Promise<Map<string, string>> {
    return new Promise((resolve, reject) => {
      if (!transactionIds || transactionIds.length === 0) {
        resolve(new Map<string, string>()) // Nothing to wait for
        return
      }

      const transactionStates = new Map<string, string>() // Stores final states
      const pendingTransactionIds = new Set<string>(transactionIds)
      const startTime = Date.now()

      const checkStatus = async () => {
        if (Date.now() - startTime > timeoutMs) {
          reject(
            Error(
              `Timeout waiting for transactions after ${timeoutMs}ms. Pending: ${Array.from(pendingTransactionIds).join(', ')}`,
            ),
          )
          return
        }

        let errorsOccurred = false
        for (const tranId of Array.from(pendingTransactionIds)) {
          // Iterate over a copy for safe removal
          try {
            const apiResponse = await this.endorseTransactionApi.transactionsTranIdGetRaw({ tranId })
            const transactionRecord = await this.handleApiResponse<TransactionRecord>(apiResponse)

            const state = transactionRecord.state
            console.log(`Transaction ${tranId} state: ${state}`)

            if (state && TRANSACTION_TERMINAL_STATES.has(state)) {
              transactionStates.set(tranId, state)
              pendingTransactionIds.delete(tranId)
              // Optional: Check for failure states immediately
              if (state === 'transaction_refused' || state === 'transaction_cancelled') {
                console.warn(`Transaction ${tranId} reached failure state: ${state}`)
                // Depending on requirements, could reject immediately here
                // reject(Error(`Transaction ${tranId} failed with state: ${state}`))
                // return
              }
            } else if (!state) {
              console.warn(`Transaction ${tranId} has no state information. Assuming pending.`)
            }
          } catch (error) {
            console.error(`Error fetching status for transaction ${tranId}:`, error)
            // Decide how to handle errors: retry, mark as failed, or reject all
            // For now, let's log and continue, assuming it might be temporary
            // If it's a 404, the transaction might not exist or was deleted.
            if (error instanceof ResponseError && error.response.status === 404) {
              console.error(`Transaction ${tranId} not found. Removing from pending list.`)
              transactionStates.set(tranId, 'not_found') // Mark as not found
              pendingTransactionIds.delete(tranId)
            } else {
              errorsOccurred = true // Mark that an error happened, maybe retry later or reject
            }
          }
        } // End of for loop

        if (pendingTransactionIds.size === 0) {
          console.log('All transactions reached a terminal state.')
          resolve(transactionStates) // All done
        } else if (errorsOccurred) {
          // Optional: Implement retry logic or fail fast
          console.warn('Errors occurred during status check. Retrying...')
          setTimeout(checkStatus, pollIntervalMs) // Retry after interval
        } else {
          // Not all finished, schedule next check
          setTimeout(checkStatus, pollIntervalMs)
        }
      }

      // Start the first check
      void checkStatus()
    })
  }

  private async handleApiResponse<T>(response: ApiResponse<T>): Promise<T> {
    if (!response.raw.ok) {
      let errorText = 'No error details available'
      try {
        errorText = await response.raw.text()
      } catch (e) {
        // Ignore error trying to read body
      }
      // Throw ResponseError for structured error handling
      throw new ResponseError(response.raw, `HTTP error! Status: ${response.raw.status}, Details: ${errorText}`)
    }
    try {
      return await response.value()
    } catch (e) {
      // Handle cases where parsing the response body fails
      console.error('Error parsing response value:', e)
      throw new Error(`Failed to parse response body: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
}

export function createTractionService(apiBase: string, tenantId: string, walletId?: string): TractionService {
  return new TractionService(tenantId, apiBase, walletId)
}
