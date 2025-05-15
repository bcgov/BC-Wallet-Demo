import { eq, inArray } from 'drizzle-orm'
import { BadRequestError } from 'routing-controllers'
import { NotFoundError } from 'routing-controllers'
import { Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { NewRelyingParty, RelyingParty, RepositoryDefinition } from '../../types'
import { credentialDefinitions, relyingParties, relyingPartiesToCredentialDefinitions } from '../schema'
import AssetRepository from './AssetRepository'
import CredentialDefinitionRepository from './CredentialDefinitionRepository'

@Service()
class RelyingPartyRepository implements RepositoryDefinition<RelyingParty, NewRelyingParty> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(relyingParty: NewRelyingParty): Promise<RelyingParty> {
    if (!relyingParty.credentialDefinitions || relyingParty.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }

    const credentialDefinitionPromises = relyingParty.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const logoResult = relyingParty.logo ? await this.assetRepository.findById(relyingParty.logo) : null

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<RelyingParty> => {
      const [relyingPartyResult] = await tx
        .insert(relyingParties)
        .values({
          ...relyingParty,
          logo: logoResult ? logoResult.id : null,
        })
        .returning()

      const relyingPartiesToCredentialDefinitionsResult = await tx
        .insert(relyingPartiesToCredentialDefinitions)
        .values(
          relyingParty.credentialDefinitions.map((credentialDefinitionId: string) => ({
            relyingParty: relyingPartyResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          relyingPartiesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      return {
        ...relyingPartyResult,
        logo: logoResult,
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(relyingParties).where(eq(relyingParties.id, id))
  }

  async update(id: string, relyingParty: NewRelyingParty): Promise<RelyingParty> {
    await this.findById(id)

    if (!relyingParty.credentialDefinitions || relyingParty.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }

    const credentialDefinitionPromises = relyingParty.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const logoResult = relyingParty.logo ? await this.assetRepository.findById(relyingParty.logo) : null

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<RelyingParty> => {
      const [relyingPartyResult] = await tx
        .update(relyingParties)
        .set({
          ...relyingParty,
          logo: logoResult ? logoResult.id : null,
        })
        .where(eq(relyingParties.id, id))
        .returning()

      await tx
        .delete(relyingPartiesToCredentialDefinitions)
        .where(eq(relyingPartiesToCredentialDefinitions.relyingParty, id))

      const relyingPartiesToCredentialDefinitionsResult = await tx
        .insert(relyingPartiesToCredentialDefinitions)
        .values(
          relyingParty.credentialDefinitions.map((credentialDefinitionId: string) => ({
            relyingParty: relyingPartyResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          relyingPartiesToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
        ),
        with: {
          cs: {
            with: {
              attributes: true,
            },
          },
          representations: true,
          revocation: true,
          icon: true,
        },
      })

      return {
        ...relyingPartyResult,
        logo: logoResult,
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
      }
    })
  }

  async findById(id: string): Promise<RelyingParty> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.relyingParties.findFirst({
      where: eq(relyingParties.id, id),
      with: {
        cds: {
          with: {
            cd: {
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
            },
          },
        },
        logo: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No relying party found for id: ${id}`))
    }

    return {
      ...result,
      credentialDefinitions: result.cds.map((item: any) => ({
        ...item.cd,
        credentialSchema: item.cd.cs,
      })),
    }
  }

  async findAll(): Promise<RelyingParty[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.relyingParties.findMany({
      with: {
        cds: {
          with: {
            cd: {
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
            },
          },
        },
        logo: true,
      },
    })

    return result.map((relyingParty) => ({
      ...relyingParty,
      credentialDefinitions: relyingParty.cds.map((item: any) => ({
        ...item.cd,
        credentialSchema: item.cd.cs,
      })),
    }))
  }
}

export default RelyingPartyRepository
