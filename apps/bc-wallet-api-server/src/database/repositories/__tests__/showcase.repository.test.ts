import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import {
  Asset,
  CredentialAttributeType,
  CredentialDefinition,
  CredentialType,
  IdentifierType,
  IssuanceScenario,
  IssuerType,
  NewCredentialDefinition,
  NewCredentialSchema,
  NewIssuanceScenario,
  NewIssuer,
  NewPersona,
  NewShowcase,
  NewTenant,
  Persona,
  ShowcaseStatus,
  StepActionType,
  StepType,
  Tenant,
  User,
} from '../../../types'
import * as schema from '../../schema'
import CredentialDefinitionRepository from '../CredentialDefinitionRepository'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import IssuerRepository from '../IssuerRepository'
import PersonaRepository from '../PersonaRepository'
import ScenarioRepository from '../ScenarioRepository'
import ShowcaseRepository from '../ShowcaseRepository'
import TenantRepository from '../TenantRepository'
import { createTestAsset, createTestUser } from './dbTestData'

describe('Database showcase repository tests', (): void => {
  let client: PGlite
  let repository: ShowcaseRepository
  let persona1: Persona
  let persona2: Persona
  let issuanceScenario1: IssuanceScenario
  let issuanceScenario2: IssuanceScenario
  let credentialDefinition1: CredentialDefinition
  let credentialDefinition2: CredentialDefinition
  let asset: Asset
  let user: User
  let tenant: Tenant

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(ShowcaseRepository)
    const issuerRepository = Container.get(IssuerRepository)
    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    user = await createTestUser('test-user-showcase')
    asset = await createTestAsset()
    const newCredentialSchema: NewCredentialSchema = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      attributes: [
        {
          name: 'example_attribute_name1',
          value: 'example_attribute_value1',
          type: CredentialAttributeType.STRING,
        },
        {
          name: 'example_attribute_name2',
          value: 'example_attribute_value2',
          type: CredentialAttributeType.STRING,
        },
      ],
    }
    const credentialSchema = await credentialSchemaRepository.create(newCredentialSchema)
    const newCredentialDefinition: NewCredentialDefinition = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      // revocation: { // TODO SHOWCASE-80 AnonCredRevocation
      //     title: 'example_revocation_title',
      //     description: 'example_revocation_description'
      // }
    }
    credentialDefinition1 = await credentialDefinitionRepository.create(newCredentialDefinition)
    credentialDefinition2 = await credentialDefinitionRepository.create(newCredentialDefinition)
    const newIssuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }
    const issuer = await issuerRepository.create(newIssuer)
    const personaRepository = Container.get(PersonaRepository)
    const newPersona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    persona1 = await personaRepository.create(newPersona)
    persona2 = await personaRepository.create(newPersona)
    const scenarioRepository = Container.get(ScenarioRepository)
    const newIssuanceScenario: NewIssuanceScenario = {
      name: 'example_name',
      description: 'example_description',
      issuer: issuer.id,
      steps: [
        {
          title: 'example_title',
          description: 'example_description',
          order: 1,
          type: StepType.HUMAN_TASK,
          asset: asset.id,
          actions: [
            {
              title: 'example_title',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
        {
          title: 'example_title',
          description: 'example_description',
          order: 2,
          type: StepType.HUMAN_TASK,
          asset: asset.id,
          actions: [
            {
              title: 'example_title',
              actionType: StepActionType.ARIES_OOB,
              text: 'example_text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona1.id, persona2.id],
      bannerImage: null,
      hidden: false,
    }
    issuanceScenario1 = await scenarioRepository.create(newIssuanceScenario)
    issuanceScenario2 = await scenarioRepository.create(newIssuanceScenario)
    const tenantRepository = Container.get(TenantRepository)
    const newTenant: NewTenant = {
      id: '79a56be5-89bd-40dc-a6a7-fc035487e437',
    }
    tenant = await tenantRepository.create(newTenant)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save showcase to database', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: asset.id,
      createdBy: user.id,
    }

    const savedShowcase = await repository.create(showcase)

    expect(savedShowcase).toBeDefined()
    expect(savedShowcase.name).toEqual(showcase.name)
    expect(savedShowcase.slug).toEqual('example-name')
    expect(savedShowcase.description).toEqual(showcase.description)
    expect(savedShowcase.status).toEqual(showcase.status)
    expect(savedShowcase.hidden).toEqual(showcase.hidden)
    expect(savedShowcase.scenarios.length).toEqual(2)
    expect(savedShowcase.personas.length).toEqual(2)
    expect(savedShowcase.bannerImage!.id).toBeDefined()
    expect(savedShowcase.bannerImage!.mediaType).toEqual(asset.mediaType)
    expect(savedShowcase.bannerImage!.fileName).toEqual(asset.fileName)
    expect(savedShowcase.bannerImage!.description).toEqual(asset.description)
    expect(savedShowcase.bannerImage!.content).toStrictEqual(asset.content)
    expect(savedShowcase.createdBy).toEqual({
      createdAt: expect.any(Date),
      id: expect.any(String),
      identifier: 'did:example.org',
      identifierType: 'DID',
      updatedAt: expect.any(Date),
    })
  })

  it('Should throw error when saving showcase with no personas', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [],
    }

    await expect(repository.create(showcase)).rejects.toThrowError(`At least one persona is required`)
  })

  it('Should throw error when saving showcase with no scenarios', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    await expect(repository.create(showcase)).rejects.toThrowError(`At least one scenario is required`)
  })

  it('Should throw error when saving showcase with invalid persona id', async (): Promise<void> => {
    const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [unknownPersonaId],
    }

    await expect(repository.create(showcase)).rejects.toThrowError(`No persona found for id: ${unknownPersonaId}`)
  })

  it('Should throw error when saving showcase with invalid banner image id', async (): Promise<void> => {
    const unknownBannerImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: unknownBannerImageId,
    }

    await expect(repository.create(showcase)).rejects.toThrowError(`No asset found for id: ${unknownBannerImageId}`)
  })

  it('Should throw error when saving showcase with invalid scenario id', async (): Promise<void> => {
    const unknownScenarioId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [unknownScenarioId],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    await expect(repository.create(showcase)).rejects.toThrowError(`No scenario found for id: ${unknownScenarioId}`)
  })

  it('Should get showcase by id from database', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)
    expect(savedShowcase).toBeDefined()

    const fromDb = await repository.findById(savedShowcase.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(showcase.name)
    expect(fromDb.description).toEqual(showcase.description)
    expect(fromDb.status).toEqual(showcase.status)
    expect(fromDb.hidden).toEqual(showcase.hidden)
    expect(fromDb.scenarios.length).toEqual(2)
    expect(fromDb.personas.length).toEqual(2)
  })

  it('Should get all showcases from database', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase1 = await repository.create(showcase)
    expect(savedShowcase1).toBeDefined()

    const savedShowcase2 = await repository.create(showcase)
    expect(savedShowcase2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb).toBeDefined()
    expect(fromDb.length).toEqual(2)
  })

  it('Should delete showcase from database', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)
    expect(savedShowcase).toBeDefined()

    await repository.delete(savedShowcase.id)

    await expect(repository.findById(savedShowcase.id)).rejects.toThrowError(
      `No showcase found for id: ${savedShowcase.id}`,
    )
  })

  it('Should update showcase in database', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const newName = 'new_name'
    const completionMessage = 'showcase completed'
    const updatedShowcase = await repository.update(savedShowcase.id, {
      name: newName,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: null,
      completionMessage,
    })

    expect(updatedShowcase).toBeDefined()
    expect(updatedShowcase.name).toEqual(newName)
    expect(updatedShowcase.slug).toEqual('new-name')
    expect(updatedShowcase.completionMessage).toEqual(completionMessage)
    expect(updatedShowcase.description).toEqual(showcase.description)
    expect(updatedShowcase.status).toEqual(showcase.status)
    expect(updatedShowcase.hidden).toEqual(showcase.hidden)
    expect(updatedShowcase.scenarios.length).toEqual(2)
    expect(updatedShowcase.personas.length).toEqual(2)
  })

  it('Should throw error when updating showcase with no personas', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const updatedShowcase: NewShowcase = {
      name: savedShowcase.name,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [],
      bannerImage: null,
    }

    await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(
      `At least one persona is required`,
    )
  })

  it('Should throw error when updating showcase with no scenarios', async (): Promise<void> => {
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const updatedShowcase: NewShowcase = {
      name: savedShowcase.name,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: null,
    }

    await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(
      `At least one scenario is required`,
    )
  })

  it('Should throw error when updating showcase with invalid persona id', async (): Promise<void> => {
    const unknownPersonaId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const updatedShowcase: NewShowcase = {
      name: savedShowcase.name,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [unknownPersonaId],
      bannerImage: null,
    }

    await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(
      `No persona found for id: ${unknownPersonaId}`,
    )
  })

  it('Should throw error when updating showcase with invalid scenario id', async (): Promise<void> => {
    const unknownScenarioId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const updatedShowcase: NewShowcase = {
      name: savedShowcase.name,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [unknownScenarioId],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: null,
    }

    await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(
      `No scenario found for id: ${unknownScenarioId}`,
    )
  })

  it('Should throw error when updating showcase with invalid banner image id', async (): Promise<void> => {
    const unknownBannerImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const showcase: NewShowcase = {
      name: 'example_name',
      description: 'example_description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      tenantId: tenant.id,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
    }

    const savedShowcase = await repository.create(showcase)

    const updatedShowcase: NewShowcase = {
      name: savedShowcase.name,
      description: savedShowcase.description,
      status: savedShowcase.status,
      hidden: savedShowcase.hidden,
      tenantId: savedShowcase.tenantId,
      scenarios: [issuanceScenario1.id, issuanceScenario2.id],
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      personas: [persona1.id, persona2.id],
      bannerImage: unknownBannerImageId,
    }
    await expect(repository.update(savedShowcase.id, updatedShowcase)).rejects.toThrowError(
      `No asset found for id: ${unknownBannerImageId}`,
    )
  })
})
