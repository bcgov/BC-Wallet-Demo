import { Inject, Service } from 'typedi'

import CredentialDefinitionRepository from '../database/repositories/CredentialDefinitionRepository'
import { CredentialDefinition, NewCredentialDefinition } from '../types'
import { ISessionService } from '../types/services/session'

/**
 * Service for managing credential definitions.
 * Provides methods for CRUD operations, approval workflow, and integration with adapter client API.
 * Extends AbstractAdapterClientService to utilize session-related functionality.
 */
@Service()
class CredentialDefinitionService {
  /**
   * Constructor for CredentialDefinitionService.
   * @param credentialDefinitionRepository Repository for credential definition data access
   * @param sessionService Service for managing user sessions
   * @param adapterClientApi Client API for interacting with the wallet adapter
   */
  public constructor(
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

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
