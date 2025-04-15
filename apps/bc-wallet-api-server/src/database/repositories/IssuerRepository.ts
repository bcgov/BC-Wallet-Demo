import { eq, inArray } from 'drizzle-orm'
import { BadRequestError } from 'routing-controllers'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import DatabaseService from '../../services/DatabaseService'
import { Issuer, NewIssuer, RepositoryDefinition } from '../../types'
import {
  credentialDefinitions,
  credentialSchemas,
  issuers,
  issuersToCredentialDefinitions,
  issuersToCredentialSchemas,
} from '../schema'
import AssetRepository from './AssetRepository'
import CredentialDefinitionRepository from './CredentialDefinitionRepository'
import CredentialSchemaRepository from './CredentialSchemaRepository'

@Service()
class IssuerRepository implements RepositoryDefinition<Issuer, NewIssuer> {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly credentialDefinitionRepository: CredentialDefinitionRepository,
    private readonly credentialSchemaRepository: CredentialSchemaRepository,
    private readonly assetRepository: AssetRepository,
  ) {}

  async create(issuer: NewIssuer): Promise<Issuer> {
    if (issuer.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (issuer.credentialSchemas.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential schema is required'))
    }

    const credentialDefinitionPromises = issuer.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const credentialSchemaPromises = issuer.credentialSchemas.map(
      async (credentialDefinition) => await this.credentialSchemaRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialSchemaPromises)
    const logoResult = issuer.logo ? await this.assetRepository.findById(issuer.logo) : null

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Issuer> => {
      const [issuerResult] = await tx
        .insert(issuers)
        .values({
          ...issuer,
          logo: logoResult ? logoResult.id : null,
        })
        .returning()

      const issuersToCredentialDefinitionsResult = await tx
        .insert(issuersToCredentialDefinitions)
        .values(
          issuer.credentialDefinitions.map((credentialDefinitionId: string) => ({
            issuer: issuerResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          issuersToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
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

      const issuersToCredentialSchemasResult = await tx
        .insert(issuersToCredentialSchemas)
        .values(
          issuer.credentialSchemas.map((credentialSchema: string) => ({
            issuer: issuerResult.id,
            credentialSchema: credentialSchema,
          })),
        )
        .returning()

      const credentialSchemasResult = await tx.query.credentialSchemas.findMany({
        where: inArray(
          credentialSchemas.id,
          issuersToCredentialSchemasResult.map((item) => item.credentialSchema),
        ),
        with: {
          attributes: true,
        },
      })

      return {
        ...issuerResult,
        logo: logoResult,
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        credentialSchemas: credentialSchemasResult,
      }
    })
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(issuers).where(eq(issuers.id, id))
  }

  async update(id: string, issuer: NewIssuer): Promise<Issuer> {
    await this.findById(id)

    if (issuer.credentialDefinitions.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential definition is required'))
    }
    if (issuer.credentialSchemas.length === 0) {
      return Promise.reject(new BadRequestError('At least one credential schema is required'))
    }

    const credentialDefinitionPromises = issuer.credentialDefinitions.map(
      async (credentialDefinition) => await this.credentialDefinitionRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialDefinitionPromises)
    const credentialSchemaPromises = issuer.credentialSchemas.map(
      async (credentialDefinition) => await this.credentialSchemaRepository.findById(credentialDefinition),
    )
    await Promise.all(credentialSchemaPromises)
    const logoResult = issuer.logo ? await this.assetRepository.findById(issuer.logo) : null

    return (await this.databaseService.getConnection()).transaction(async (tx): Promise<Issuer> => {
      const [issuerResult] = await tx
        .update(issuers)
        .set({
          ...issuer,
          logo: logoResult ? logoResult.id : null,
        })
        .where(eq(issuers.id, id))
        .returning()

      await tx.delete(issuersToCredentialDefinitions).where(eq(issuersToCredentialDefinitions.issuer, id))
      await tx.delete(issuersToCredentialSchemas).where(eq(issuersToCredentialSchemas.issuer, id))

      const issuersToCredentialDefinitionsResult = await tx
        .insert(issuersToCredentialDefinitions)
        .values(
          issuer.credentialDefinitions.map((credentialDefinitionId: string) => ({
            issuer: issuerResult.id,
            credentialDefinition: credentialDefinitionId,
          })),
        )
        .returning()

      const credentialDefinitionsResult = await tx.query.credentialDefinitions.findMany({
        where: inArray(
          credentialDefinitions.id,
          issuersToCredentialDefinitionsResult.map((item) => item.credentialDefinition),
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

      const issuersToCredentialSchemasResult = await tx
        .insert(issuersToCredentialSchemas)
        .values(
          issuer.credentialSchemas.map((credentialSchema: string) => ({
            issuer: issuerResult.id,
            credentialSchema: credentialSchema,
          })),
        )
        .returning()

      const credentialSchemasResult = await tx.query.credentialSchemas.findMany({
        where: inArray(
          credentialSchemas.id,
          issuersToCredentialSchemasResult.map((item) => item.credentialSchema),
        ),
        with: {
          attributes: true,
        },
      })

      return {
        ...issuerResult,
        logo: logoResult,
        credentialDefinitions: credentialDefinitionsResult.map((item: any) => ({
          ...item,
          credentialSchema: item.cs,
        })),
        credentialSchemas: credentialSchemasResult,
      }
    })
  }

  async findById(id: string): Promise<Issuer> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.issuers.findFirst({
      where: eq(issuers.id, id),
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
        css: {
          with: {
            cs: {
              with: {
                attributes: true,
              },
            },
          },
        },
        logo: true,
      },
    })

    if (!result) {
      return Promise.reject(new NotFoundError(`No issuer found for id: ${id}`))
    }

    return {
      ...result,
      credentialDefinitions: result.cds.map((item: any) => ({
        ...item.cd,
        credentialSchema: item.cd.cs,
      })),
      credentialSchemas: result.css.map((item) => item.cs),
    }
  }

  async findAll(): Promise<Issuer[]> {
    const result = await (
      await this.databaseService.getConnection()
    ).query.issuers.findMany({
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
        css: {
          with: {
            cs: {
              with: {
                attributes: true,
              },
            },
          },
        },
        logo: true,
      },
    })

    return result.map((issuer) => ({
      ...issuer,
      credentialDefinitions: issuer.cds.map((item: any) => ({
        ...item.cd,
        credentialSchema: item.cd.cs,
      })),
      credentialSchemas: issuer.css.map((item) => item.cs),
    }))
  }
}

export default IssuerRepository
