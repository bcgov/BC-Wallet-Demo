import { IAdapterClientApi } from 'bc-wallet-adapter-client-api'
import { CredentialDefinitionFromJSONTyped } from 'bc-wallet-openapi'
import { Inject, Service } from 'typedi'

import CredentialDefinitionRepository from '../database/repositories/CredentialDefinitionRepository'
import { CredentialDefinition, NewCredentialDefinition } from '../types'
import { ISessionService } from '../types/services/session'
import { AbstractAdapterClientService } from './AbstractAdapterClientService'

/**
 * Service for managing credential definitions.
 * Provides methods for CRUD operations, approval workflow, and integration with adapter client API.
 * Extends AbstractAdapterClientService to utilize session-related functionality.
 */
@Service()
class CredentialDefinitionService extends AbstractAdapterClientService {
  public constructor(
    @Inject('ISessionService') sessionService: ISessionService,
    @Inject('IAdapterClientApi') private readonly adapterClientApi: IAdapterClientApi,
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
  ) {
    super(sessionService)
  }

  /**
   * Retrieves all credential definitions.
   * @returns Promise resolving to an array of CredentialDefinition objects
   */
  public getCredentialDefinitions = async (): Promise<CredentialDefinition[]> => {
    return this.credentialDefinitionRepository.findAll()
  }

  /**
   * Retrieves a specific credential definition by ID.
   * @param id The ID of the credential definition to retrieve
   * @returns Promise resolving to the requested CredentialDefinition
   */
  public getCredentialDefinition = async (id: string): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.findById(id)
  }

  /**
   * Retrieves all unapproved credential definitions.
   * @returns Promise resolving to an array of unapproved CredentialDefinition objects
   */
  public getUnapproved = async (): Promise<CredentialDefinition[]> => {
    return this.credentialDefinitionRepository.findUnapproved()
  }

  /**
   * Creates a new credential definition.
   * @param credentialDefinition The new credential definition data
   * @returns Promise resolving to the created CredentialDefinition
   */
  public createCredentialDefinition = async (
    credentialDefinition: NewCredentialDefinition,
  ): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.create(credentialDefinition)
  }

  /**
   * Updates an existing credential definition.
   * @param id The ID of the credential definition to update
   * @param credentialDefinition The updated credential definition data
   * @returns Promise resolving to the updated CredentialDefinition
   */
  public updateCredentialDefinition = async (
    id: string,
    credentialDefinition: NewCredentialDefinition,
  ): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.update(id, credentialDefinition)
  }

  /**
   * Deletes a credential definition.
   * @param id The ID of the credential definition to delete
   * @returns Promise resolving when deletion is complete
   */
  public deleteCredentialDefinition = async (id: string): Promise<void> => {
    return this.credentialDefinitionRepository.delete(id)
  }

  /**
   * Imports a credential definition into the system and adapter.
   * @param credentialDefinition The credential definition to import
   * @returns Promise resolving when import is complete
   * @throws Error if identifier type or identifier is missing
   */
  public importCredentialDefinition = async (
    credentialDefinition: NewCredentialDefinition,
  ): Promise<CredentialDefinition> => {
    if (!credentialDefinition.identifierType || !credentialDefinition.identifier) {
      return Promise.reject(Error('Identifier type and identifier are required for credential definition import.'))
    }

    const savedDefinition = await this.createCredentialDefinition(credentialDefinition)
    await this.adapterClientApi.importCredentialDefinition(
      CredentialDefinitionFromJSONTyped(savedDefinition, false),
      this.buildSendOptions(),
    )
    return savedDefinition
  }

  /**
   * Approves a credential definition.
   * @param id The ID of the credential definition to approve
   * @returns Promise resolving to the updated CredentialDefinition
   * @throws NotFoundError if the definition doesn't exist
   * @throws Error if the current user cannot be determined
   */
  public approveCredentialDefinition = async (id: string): Promise<CredentialDefinition> => {
    const currentUser = await this.sessionService.getCurrentUser()
    if (!currentUser) {
      return Promise.reject(new Error('Could not determine the approving user.'))
    }

    await this.credentialDefinitionRepository.findById(id)

    return this.credentialDefinitionRepository.approve(id, currentUser.id)
  }

  /**
   * Checks if a credential definition is approved.
   * @param id The ID of the credential definition to check
   * @returns Promise resolving to boolean indicating approval status
   */
  public isApproved = async (id: string): Promise<boolean> => {
    const credentialDef = await this.credentialDefinitionRepository.findById(id)
    return credentialDef.approvedBy !== undefined && credentialDef.approvedBy !== null
  }
}

export default CredentialDefinitionService
