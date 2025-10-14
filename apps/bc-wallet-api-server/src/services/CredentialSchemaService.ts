import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { CredentialDefinitionImportRequest } from 'bc-wallet-openapi'
import { randomUUID } from 'crypto'
import { Inject, Service } from 'typedi'
import { validate as uuidValidate } from 'uuid'

import CredentialSchemaRepository from '../database/repositories/CredentialSchemaRepository'
import JobEntityMapRepository from '../database/repositories/JobEntityMapRepository'
import JobStatusRepository from '../database/repositories/JobStatusRepository'
import { CredentialSchema, NewCredentialSchema } from '../types'
import type { ISessionService } from '../types/services/session'
import { createRequestLogger } from '../utils/logger'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'
import TenantService from './TenantService'

/**
 * Service for managing credential schemas.
 * Handles CRUD operations and integration with adapter client API.
 * Extends AbstractAdapterClientService for session functionality.
 */
@Service()
class CredentialSchemaService extends AbstractAdapterClientService {
  private readonly logger = createRequestLogger('CredentialSchemaService')

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
    private readonly jobStatusRepository: JobStatusRepository,
    private readonly jobEntityMapRepository: JobEntityMapRepository,
    tenantService: TenantService,
  ) {
    super(sessionService, tenantService)
  }

  /**
   * Retrieves all credential schemas.
   * @returns Promise resolving to an array of CredentialSchema objects
   */
  public getCredentialSchemas = async (): Promise<CredentialSchema[]> => {
    this.logger.info('Retrieving all credential schemas')
    try {
      // Filter out any credential schemas that are still pending creation
      const schemas = await this.credentialSchemaRepository.findAll()
      this.logger.info({ count: schemas.length }, 'Successfully retrieved credential schemas')
      return schemas
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve credential schemas')
      throw error
    }
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
    console.debug('Creating credential schema', { credentialSchema })
    const savedCredentialSchema = await this.credentialSchemaRepository.create(credentialSchema)
    if (!savedCredentialSchema) {
      this.logger.error({ credentialSchema }, 'Failed to create credential schema')
      throw new Error('Failed to create credential schema')
    }
    if (credentialSchema.jobId) {
      await this.jobStatusRepository.update(credentialSchema.jobId, {
        status: 'completed',
        resultData: savedCredentialSchema,
      })

      // Update job entity map with the actual credential schema ID
      await this.jobEntityMapRepository.updateStatus(credentialSchema.jobId, {
        status: 'completed',
        entityId: savedCredentialSchema.id as unknown as string,
      })
    }
    return savedCredentialSchema
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
   * @param importRequest The credential schema to import
   * @returns Promise resolving when import is complete
   * @throws Error if identifier type or identifier is missing
   */
  public importCredentialSchema = async (importRequest: CredentialDefinitionImportRequest): Promise<void> => {
    if (!importRequest.identifierType || !importRequest.identifier) {
      return Promise.reject(Error('Identifier type and identifier are required for credential schema import.'))
    }

    const jobDetails = await this.jobStatusRepository.create({
      status: 'pending',
      apiName: 'importCredentialSchema',
      endpoint: '/credentials/schemas/import',
      payloadData: JSON.stringify(importRequest),
    })
    await this.jobEntityMapRepository.create({
      jobId: jobDetails.jobId as unknown as string,
      entityType: 'credentialSchema',
      entityId: randomUUID(),
      status: 'pending',
      action: 'create',
    })
    importRequest.jobId = jobDetails.jobId as unknown as string

    // importCredentialSchema: Starting import with request
    await this.adapterClientApi.importCredentialSchema(importRequest, await this.buildSendOptions())
  }
}

export default CredentialSchemaService
