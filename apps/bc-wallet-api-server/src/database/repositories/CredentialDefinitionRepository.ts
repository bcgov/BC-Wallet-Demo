import { and, eq, isNull } from 'drizzle-orm'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import DatabaseService from '../../services/DatabaseService'
import { CredentialDefinition, IdentifierType, NewCredentialDefinition, RepositoryDefinition, Tx } from '../../types'
import { credentialDefinitions, credentialRepresentations, revocationInfo } from '../schema'
import AssetRepository from './AssetRepository'
import CredentialSchemaRepository from './CredentialSchemaRepository'

@Service()
class CredentialDefinitionRepository implements RepositoryDefinition<CredentialDefinition, NewCredentialDefinition> {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly assetRepository: AssetRepository,
    private readonly credentialSchemaRepository: CredentialSchemaRepository,
  ) {}

  public async create(credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    const iconResult = credentialDefinition.icon && (await this.assetRepository.findById(credentialDefinition.icon))
    const credentialSchemaResult = await this.credentialSchemaRepository.findById(credentialDefinition.credentialSchema)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      const [credentialDefinitionResult] = await tx
        .insert(credentialDefinitions)
        .values(credentialDefinition)
        .returning()

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
        approvedBy: null,
        approvedAt: null,
      }
    })
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection())
      .delete(credentialDefinitions)
      .where(eq(credentialDefinitions.id, id))
  }

  public async update(id: string, credentialDefinition: NewCredentialDefinition): Promise<CredentialDefinition> {
    await this.findById(id)

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<CredentialDefinition> => {
      await tx.update(credentialDefinitions).set(credentialDefinition).where(eq(credentialDefinitions.id, id))

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
      //let revocationResult = null
      // if (credentialDefinition.revocation) {
      //     [revocationResult] = await tx.insert(revocationInfo)
      //         .values({
      //             ...credentialDefinition.revocation,
      //             credentialDefinition: credentialDefinitionResult.id
      //         })
      //         .returning();
      // }

      // 3. Re-fetch the complete record *using the transaction object 'tx'*
      const updatedRecord = await tx.query.credentialDefinitions.findFirst({
        where: eq(credentialDefinitions.id, id),
        with: {
          icon: true,
          cs: {
            // Fetch the schema relation
            with: {
              attributes: true,
            },
          },
          approver: true,
          // representations: true, // Fetch representations if managed here and relation exists
          // revocation: true, // Fetch revocation if managed here and relation exists
        },
      })

      if (!updatedRecord) {
        // Should not happen, but makes ts happy
        return Promise.reject(new Error(`Failed to re-fetch credential definition after update: ${id}`))
      }

      return {
        // Map direct columns from updatedRecord
        id: updatedRecord.id,
        name: updatedRecord.name,
        version: updatedRecord.version,
        identifierType: updatedRecord.identifierType,
        identifier: updatedRecord.identifier,
        type: updatedRecord.type,
        source: updatedRecord.source,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
        approvedAt: updatedRecord.approvedAt,

        // Map related objects from the fetch
        // Use the objects fetched *during the re-fetch* inside the transaction
        credentialSchema: {
          ...updatedRecord.cs,
          attributes: updatedRecord.cs.attributes ?? [],
        },
        icon: updatedRecord.icon ?? undefined,
        representations: [], // updatedRecord.representations,
        revocation: null, // updatedRecord.revocation,
        approvedBy: updatedRecord.approver,
      }
    })
  }

  public async findById(id: string, tx?: Tx): Promise<CredentialDefinition> {
    const result = await (tx ?? (await this.databaseService.getConnection())).query.credentialDefinitions.findFirst({
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
        approver: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential definition found for id: ${id}`))
    }

    return {
      ...result,
      icon: result.icon ? result.icon : undefined,
      credentialSchema: result.cs,
      approvedBy: result.approver,
    }
  }

  public async findByIdentifier(
    identifier: string,
    identifierType?: IdentifierType,
    tx?: Tx,
  ): Promise<CredentialDefinition> {
    const whereConditions = [eq(credentialDefinitions.identifier, identifier)]
    if (identifierType !== undefined) {
      whereConditions.push(eq(credentialDefinitions.identifierType, identifierType))
    }

    const result = await (tx ?? (await this.databaseService.getConnection())).query.credentialDefinitions.findFirst({
      where: and(...whereConditions),
      with: {
        icon: true,
        cs: {
          with: {
            attributes: true,
          },
        },
        representations: true,
        revocation: true,
        approver: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No credential definition found for identifier: ${identifier}`))
    }

    return {
      ...result,
      icon: result.icon ? result.icon : undefined,
      credentialSchema: result.cs,
      approvedBy: result.approver,
    }
  }

  public async findAll(): Promise<CredentialDefinition[]> {
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
        approver: true,
      },
    })

    return result.map((item: any) => ({
      ...item,
      credentialSchema: item.cs,
      approvedBy: item.approver,
    }))
  }

  public async findUnapproved(): Promise<CredentialDefinition[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.credentialDefinitions.findMany({
      where: isNull(credentialDefinitions.approvedAt),
      with: {
        icon: true,
        cs: {
          with: {
            attributes: true,
          },
        },
        representations: true,
        revocation: true,
        approver: true,
      },
    })

    return result.map(
      (item): CredentialDefinition => ({
        ...item,
        credentialSchema: {
          ...item.cs,
          attributes: item.cs.attributes ?? [],
        },
        icon: item.icon ?? undefined,
        representations: item.representations ?? [],
        revocation: item.revocation,
        approvedBy: null,
        approvedAt: null,
      }),
    )
  }

  public async approve(id: string, userId: string): Promise<CredentialDefinition> {
    const now = new Date()

    const connection = await this.databaseService.getConnection()
    return await connection.transaction(async (tx) => {
      await tx
        .update(credentialDefinitions)
        .set({
          approvedBy: userId,
          approvedAt: now,
          updatedAt: now,
        })
        .where(eq(credentialDefinitions.id, id))
      return await this.findById(id, tx)
    })
  }
}

export default CredentialDefinitionRepository
