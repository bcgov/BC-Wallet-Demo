import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import ShowcaseController from '../ShowcaseController'
import { Application } from 'express'
import { CredentialAttributeType, CredentialType, IdentifierType, IssuerType, ShowcaseStatus, StepActionType, StepType } from '../../types'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import ShowcaseService from '../../services/ShowcaseService'
import { ShowcaseRequest } from 'bc-wallet-openapi'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'

describe('ShowcaseController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(ScenarioRepository)
    Container.get(ShowcaseRepository)
    Container.get(ShowcaseService)
    app = createExpressServer({
      controllers: [ShowcaseController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a showcase', async () => {
    // Create prerequisites: asset, credential schema, credential definition, issuer, persona, and scenario
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const credentialSchema = await credentialSchemaRepository.create({
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
    })

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialDefinition = await credentialDefinitionRepository.create({
      name: 'Test Definition',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const issuerRepository = Container.get(IssuerRepository)
    const issuer = await issuerRepository.create({
      name: 'Test Issuer',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      credentialSchemas: [credentialSchema.id],
      description: 'Test issuer description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // Create a persona
    const personaRepository = Container.get(PersonaRepository)
    const persona = await personaRepository.create({
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    })

    // Create an issuance scenario with at least one step
    const scenarioRepository = Container.get(ScenarioRepository)
    const scenario = await scenarioRepository.create({
      name: 'Test Scenario',
      description: 'Test scenario description',
      issuer: issuer.id, // This makes it an issuance scenario
      steps: [
        {
          title: 'Test Step',
          description: 'Test step description',
          order: 1,
          type: StepType.HUMAN_TASK,
          asset: asset.id,
          actions: [
            {
              title: 'Test Action',
              actionType: StepActionType.ARIES_OOB,
              text: 'Test action text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {},
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      hidden: false,
    })

    // 1. Create a showcase
    const showcaseRequest: ShowcaseRequest = {
      name: 'Test Showcase',
      description: 'Test showcase description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      personas: [persona.id],
      bannerImage: asset.id,
      completionMessage: 'Congratulations on completing the showcase!',
    }

    const createResponse = await request.post('/showcases').send(showcaseRequest).expect(201)

    const createdShowcase = createResponse.body.showcase
    expect(createdShowcase).toHaveProperty('id')
    expect(createdShowcase.name).toEqual('Test Showcase')
    expect(createdShowcase.status).toEqual(ShowcaseStatus.ACTIVE)
    expect(createdShowcase.scenarios.length).toEqual(1)
    expect(createdShowcase.personas.length).toEqual(1)
    expect(createdShowcase.bannerImage).toBeDefined()
    expect(createdShowcase.completionMessage).toEqual('Congratulations on completing the showcase!')

    // 2. Retrieve all showcases
    const getAllResponse = await request.get('/showcases').expect(200)
    expect(getAllResponse.body.showcases).toBeInstanceOf(Array)
    expect(getAllResponse.body.showcases.length).toBe(1)

    // 3. Retrieve the created showcase
    const getResponse = await request.get(`/showcases/${createdShowcase.slug}`).expect(200)
    expect(getResponse.body.showcase.name).toEqual('Test Showcase')

    // 4. Update the showcase
    const updatedRequest = {
      ...showcaseRequest,
      name: 'Updated Showcase Name',
      description: 'Updated showcase description',
      status: ShowcaseStatus.PENDING,
    }

    const updateResponse = await request.put(`/showcases/${createdShowcase.slug}`).send(updatedRequest).expect(200)
    const updatedShowcase = updateResponse.body.showcase

    expect(updateResponse.body.showcase.name).toEqual('Updated Showcase Name')
    expect(updateResponse.body.showcase.description).toEqual('Updated showcase description')
    expect(updateResponse.body.showcase.status).toEqual(ShowcaseStatus.PENDING)

    // 5. Delete the showcase
    await request.delete(`/showcases/${updatedShowcase.slug}`).expect(204)

    // 6. Verify showcase deletion
    await request.get(`/showcases/${updatedShowcase.slug}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentSlug = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent showcase
    await request.get(`/showcases/${nonExistentSlug}`).expect(404)
  })

  it('should validate request data when creating a showcase', async () => {
    // Attempt to create a showcase with missing required fields
    const invalidShowcaseRequest = {
      // Missing name, description, etc.
    }

    await request.post('/showcases').send(invalidShowcaseRequest).expect(400)

    // Attempt to create a showcase with non-existent IDs
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidShowcaseRequest2: ShowcaseRequest = {
      name: 'Invalid Showcase',
      description: 'Test description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [nonExistentId],
      personas: [nonExistentId],
    }

    await request.post('/showcases').send(invalidShowcaseRequest2).expect(404)
  })
})
