import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import {
  Asset,
  CredentialDefinition,
  IssuanceScenario,
  NewShowcase,
  Persona,
  ShowcaseStatus,
  Tenant,
  User,
} from '../../../types'
import * as schema from '../../schema'
import ShowcaseRepository from '../ShowcaseRepository'
import {
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestIssuer,
  createTestPersona,
  createTestScenario,
  createTestTenant,
  createTestUser,
} from './dbTestData'

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

    // Create test utilities using dbTestData helper functions
    user = await createTestUser('test-user-showcase')
    asset = await createTestAsset()
    tenant = await createTestTenant()

    // Create credential schema and definitions
    const credentialSchema = await createTestCredentialSchema()
    credentialDefinition1 = await createTestCredentialDefinition(asset, credentialSchema, tenant.id)
    credentialDefinition2 = await createTestCredentialDefinition(asset, credentialSchema, tenant.id)

    // Create issuer
    const issuer = await createTestIssuer(asset, credentialDefinition1, credentialSchema)

    // Create personas
    persona1 = await createTestPersona(asset)
    persona2 = await createTestPersona(asset)

    // Create scenarios
    issuanceScenario1 = await createTestScenario(asset, persona1, issuer, credentialDefinition1.id)
    issuanceScenario2 = await createTestScenario(asset, persona2, issuer, credentialDefinition2.id)
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
      userName: 'test-user-showcase',
      createdAt: expect.any(Date),
      id: expect.any(String),
      updatedAt: expect.any(Date),
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      tenants: [],
      clientId: 'showcase-tenantA',
    })
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

    const fromDb = await repository.findAll(tenant.id)

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
