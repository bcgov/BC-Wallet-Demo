import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import AssetRepository from './AssetRepository'
import { NotFoundError } from '../../errors'
import { credentialDefinitions, credentialRepresentations, revocationInfo } from '../schema'
import CredentialSchemaRepository from './CredentialSchemaRepository'
import { CredentialDefinition, NewCredentialDefinition, RepositoryDefinition } from '../../types'

@Service()
class CredentialDefinitionRepository implements RepositoryDefinition<CredentialDefinition, NewCredentialDefinition> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
    private readonly credentialSchemaRepository: CredentialSchemaRepository,
  ) {}

  async create(credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    const iconResult = credentialDefinition.icon && (await this.assetRepository.findById(credentialDefinition.icon))
    const credentialSchemaResult = await this.credentialSchemaRepository.findById(credentialDefinition.credentialSchema)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      const [credentialDefinitionResult] = await tx.insert(credentialDefinitions).values(credentialDefinition).returning()

      // TODO SHOWCASE-81 enable
      // const credentialRepresentationsResult = await tx.insert(credentialRepresentations)
      //     .values(credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
      //         ...representation,
      //         credentialDefinition: credentialDefinitionResult.id
      //     })))
      //     .returning();

      // TODO SHOWCASE-80 enable
      let revocationResult = null
      // if (credentialDefinition.revocation) {
      //     [revocationResult] = await tx.insert(revocationInfo)
      //         .values({
      //             ...credentialDefinition.revocation,
      //             credentialDefinition: credentialDefinitionResult.id
      //         })
      //         .returning();
      // }

      return {
        ...credentialDefinitionResult,
        credentialSchema: credentialSchemaResult,
        icon: iconResult ? iconResult : undefined,
        representations: [], //credentialRepresentationsResult, TODO SHOWCASE-81 enable
        revocation: revocationResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(credentialDefinitions).where(eq(credentialDefinitions.id, id))
  }

  async update(id: string, credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    await this.findById(id)

    const iconResult = credentialDefinition.icon && (await this.assetRepository.findById(credentialDefinition.icon))
    const credentialSchemaResult = await this.credentialSchemaRepository.findById(credentialDefinition.credentialSchema)
    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      const [credentialDefinitionResult] = await tx
        .update(credentialDefinitions)
        .set(credentialDefinition)
        .where(eq(credentialDefinitions.id, id))
        .returning()

      await tx.delete(credentialRepresentations).where(eq(credentialRepresentations.credentialDefinition, id))
      await tx.delete(revocationInfo).where(eq(revocationInfo.credentialDefinition, id))

      // TODO SHOWCASE-81 enable
      // const credentialRepresentationsResult = await tx.insert(credentialRepresentations)
      //     .values(credentialDefinition.representations.map((representation: NewCredentialRepresentation) => ({
      //         ...representation,
      //         credentialDefinition: credentialDefinitionResult.id
      //     })))
      //     .returning();

      // TODO SHOWCASE-80 enable
      let revocationResult = null
      // if (credentialDefinition.revocation) {
      //     [revocationResult] = await tx.insert(revocationInfo)
      //         .values({
      //             ...credentialDefinition.revocation,
      //             credentialDefinition: credentialDefinitionResult.id
      //         })
      //         .returning();
      // }

      return {
        ...credentialDefinitionResult,
        credentialSchema: credentialSchemaResult,
        icon: iconResult || undefined,
        representations: [], //credentialRepresentationsResult, TODO SHOWCASE-81 enable
        revocation: revocationResult,
      }
    })
  }

  async findById(id: string): Promise<CredentialDefinition> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialDefinitions.findFirst({
      where: eq(credentialDefinitions.id, id),
      with: {
        icon: true,
        cs: {
          with: {
            attributes: true,
          },
        },
        representations: true,
        revocation: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential definition found for id: ${id}`))
    }

    return {
      ...result,
      icon: result.icon ? result.icon : undefined,
      credentialSchema: result.cs,
    }
  }

  async findAll(): Promise<CredentialDefinition[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialDefinitions.findMany({
      with: {
        icon: true,
        cs: {
          with: {
            attributes: true,
          },
        },
        representations: true,
        revocation: true,
      },
    })

    return result.map((item: any) => ({
      ...item,
      credentialSchema: item.cs,
    }))
  }
}

export default CredentialDefinitionRepository
