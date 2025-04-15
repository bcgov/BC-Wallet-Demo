import { Inject, Service } from 'typedi'
import CredentialDefinitionRepository from '../database/repositories/CredentialDefinitionRepository'
import { CredentialDefinition, NewCredentialDefinition } from '../types'
import { ISessionService } from '../types/services/session'

@Service()
class CredentialDefinitionService {
  constructor(
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public getCredentialDefinitions = async (): Promise<CredentialDefinition[]> => {
    return this.credentialDefinitionRepository.findAll()
  }

  public getCredentialDefinition = async (id: string): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.findById(id)
  }

  public getUnapproved = async (): Promise<CredentialDefinition[]> => {
    return this.credentialDefinitionRepository.findUnapproved()
  }

  public createCredentialDefinition = async (
    credentialDefinition: NewCredentialDefinition,
  ): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.create(credentialDefinition)
  }

  public updateCredentialDefinition = async (
    id: string,
    credentialDefinition: NewCredentialDefinition,
  ): Promise<CredentialDefinition> => {
    return this.credentialDefinitionRepository.update(id, credentialDefinition)
  }

  public deleteCredentialDefinition = async (id: string): Promise<void> => {
    return this.credentialDefinitionRepository.delete(id)
  }

  /**
   * Approves a credential definition.
   * @param id The ID of the credential definition to approve.
   * @returns The updated CredentialDefinition.
   * @throws NotFoundError if the definition doesn't exist.
   * @throws Error if the current user cannot be determined (implementation specific).
   */
  public approveCredentialDefinition = async (id: string): Promise<CredentialDefinition> => {
    const currentUser = await this.sessionService.getCurrentUser()
    if (!currentUser) {
      return Promise.reject(new Error('Could not determine the approving user.'))
    }

    await this.credentialDefinitionRepository.findById(id)

    return this.credentialDefinitionRepository.approve(id, currentUser.id)
  }

  public isApproved = async (id: string) : Promise<boolean> => {
    const credentialDef = await this.credentialDefinitionRepository.findById(id)
    return credentialDef.approvedBy !== undefined && credentialDef.approvedBy !== null
  }
}

export default CredentialDefinitionService
