import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { CredentialSchemaFromJSONTyped } from 'bc-wallet-openapi'
import { Inject, Service } from 'typedi'
import { validate as uuidValidate } from 'uuid'

import CredentialSchemaRepository from '../database/repositories/CredentialSchemaRepository'
import { CredentialSchema, NewCredentialSchema } from '../types'
import type { ISessionService } from '../types/services/session'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'

/**
 * Service for managing credential schemas.
 * Handles CRUD operations and integration with adapter client API.
 * Extends AbstractAdapterClientService for session functionality.
 */
@Service()
class CredentialSchemaService extends AbstractAdapterClientService {
  /**
   * Constructor for CredentialSchemaService.
   * @param sessionService Service for managing user sessions
   * @param adapterClientApi Client API for interacting with the wallet adapter
   * @param credentialSchemaRepository Repository for credential schema data access
   */
  public constructor(
    @Inject('ISessionService') sessionService: ISessionService,
    @Inject('IAdapterClientApi') private readonly adapterClientApi: IAdapterClientApi,
    private readonly credentialSchemaRepository: CredentialSchemaRepository,
  ) {
    super(sessionService)
  }

  /**
   * Retrieves all credential schemas.
   * @returns Promise resolving to an array of CredentialSchema objects
   */
  public getCredentialSchemas = async (): Promise<CredentialSchema[]> => {
    return this.credentialSchemaRepository.findAll()
  }

  /**
   * Retrieves a specific credential schema by ID.
   * @param id The ID of the credential schema to retrieve
   * @returns Promise resolving to the requested CredentialSchema
   */
  public getCredentialSchema = async (id: string): Promise<CredentialSchema> => {
    if (!uuidValidate(id) && id.split(':').length >= 3) {
      // support for lookup by indy identifier
      return this.credentialSchemaRepository.findByIdentifier(id)
    }
    return this.credentialSchemaRepository.findById(id)
  }

  /**
   * Creates a new credential schema.
   * @param credentialSchema The new credential schema data
   * @returns Promise resolving to the created CredentialSchema
   */
  public createCredentialSchema = async (credentialSchema: NewCredentialSchema): Promise<CredentialSchema> => {
    return this.credentialSchemaRepository.create(credentialSchema)
  }

  /**
   * Updates an existing credential schema.
   * @param id The ID of the credential schema to update
   * @param credentialSchema The updated credential schema data
   * @returns Promise resolving to the updated CredentialSchema
   */
  public updateCredentialSchema = async (
    id: string,
    credentialSchema: NewCredentialSchema,
  ): Promise<CredentialSchema> => {
    return this.credentialSchemaRepository.update(id, credentialSchema)
  }

  /**
   * Deletes a credential schema.
   * @param id The ID of the credential schema to delete
   * @returns Promise resolving when deletion is complete
   */
  public deleteCredentialSchema = async (id: string): Promise<void> => {
    return this.credentialSchemaRepository.delete(id)
  }

  /**
   * Imports a credential schema into the system and adapter.
   * @param credentialSchema The credential schema to import
   * @returns Promise resolving when import is complete
   * @throws Error if identifier type or identifier is missing
   */
  public importCredentialSchema = async (credentialSchema: NewCredentialSchema): Promise<CredentialSchema> => {
    if (!credentialSchema.identifierType || !credentialSchema.identifier) {
      return Promise.reject(Error('Identifier type and identifier are required for credential schema import.'))
    }

    const savedSchema = await this.createCredentialSchema(credentialSchema)
    await this.adapterClientApi.importCredentialSchema(
      CredentialSchemaFromJSONTyped(savedSchema, false),
      this.buildSendOptions(),
    )
    return savedSchema
  }
}

export default CredentialSchemaService
