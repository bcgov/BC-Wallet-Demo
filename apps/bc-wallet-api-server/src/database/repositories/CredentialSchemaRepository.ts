import { eq } from 'drizzle-orm'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import DatabaseService from '../../services/DatabaseService'
import {
  CredentialAttribute,
  CredentialSchema,
  NewCredentialAttribute,
  NewCredentialSchema,
  RepositoryDefinition,
} from '../../types'
import { credentialAttributes, credentialSchemas } from '../schema'

@Service()
class CredentialSchemaRepository implements RepositoryDefinition<CredentialSchema, NewCredentialSchema> {
  constructor(private readonly databaseService: DatabaseService) {}

  public async create(credentialSchema: NewCredentialSchema): Promise<CredentialSchema> {
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialSchema> => {
      const [credentialSchemaResult] = await tx.insert(credentialSchemas).values(credentialSchema).returning()

      let credentialAttributesResult: CredentialAttribute[] = []
      if (credentialSchema.attributes && credentialSchema.attributes.length > 0) {
        credentialAttributesResult = await tx
          .insert(credentialAttributes)
          .values(
            credentialSchema.attributes.map((attribute: NewCredentialAttribute) => ({
              ...attribute,
              credentialSchema: credentialSchemaResult.id,
            })),
          )
          .returning()
      }

      return {
        ...credentialSchemaResult,
        attributes: credentialAttributesResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(credentialSchemas).where(eq(credentialSchemas.id, id))
  }

  async update(id: string, credentialSchema: NewCredentialSchema): Promise<CredentialSchema> {
    await this.findById(id)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialSchema> => {
      const [credentialSchemaResult] = await tx
        .update(credentialSchemas)
        .set(credentialSchema)
        .where(eq(credentialSchemas.id, id))
        .returning()

      await tx.delete(credentialAttributes).where(eq(credentialAttributes.credentialSchema, id))

      const credentialAttributesResult = await tx
        .insert(credentialAttributes)
        .values(
          credentialSchema.attributes.map((attribute: NewCredentialAttribute) => ({
            ...attribute,
            credentialSchema: credentialSchemaResult.id,
          })),
        )
        .returning()

      return {
        ...credentialSchemaResult,
        attributes: credentialAttributesResult,
      }
    })
  }

  async findById(id: string): Promise<CredentialSchema> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialSchemas.findFirst({
      where: eq(credentialSchemas.id, id),
      with: {
        attributes: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential schema found for id: ${id}`))
    }

    return result
  }

  async findByIdentifier(identifier: string): Promise<CredentialSchema> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialSchemas.findFirst({
      where: eq(credentialSchemas.identifier, identifier),
      with: {
        attributes: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential schema found for identifier: ${identifier}`))
    }

    return result
  }

  async findAll(): Promise<CredentialSchema[]> {
    return (await this.databaseService.getConnection()).query.credentialSchemas.findMany({
      with: {
        attributes: true,
      },
    })
  }
}

export default CredentialSchemaRepository
