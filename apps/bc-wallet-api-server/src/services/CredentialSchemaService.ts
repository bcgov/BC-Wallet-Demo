import { Service } from 'typedi'
import CredentialSchemaRepository from '../database/repositories/CredentialSchemaRepository'
import { CredentialSchema, NewCredentialSchema } from '../types'

@Service()
class CredentialSchemaService {
  constructor(private readonly credentialSchemaRepository: CredentialSchemaRepository) {}

  public getCredentialSchemas = async (): Promise<CredentialSchema[]> => {
    return this.credentialSchemaRepository.findAll()
  }

  public getCredentialSchema = async (id: string): Promise<CredentialSchema> => {
    return this.credentialSchemaRepository.findById(id)
  }

  public createCredentialSchema = async (credentialSchema: NewCredentialSchema): Promise<CredentialSchema> => {
    return this.credentialSchemaRepository.create(credentialSchema)
  }

  public updateCredentialSchema = async (id: string, credentialSchema: NewCredentialSchema): Promise<CredentialSchema> => {
    return this.credentialSchemaRepository.update(id, credentialSchema)
  }

  public deleteCredentialSchema = async (id: string): Promise<void> => {
    return this.credentialSchemaRepository.delete(id)
  }
}

export default CredentialSchemaService
