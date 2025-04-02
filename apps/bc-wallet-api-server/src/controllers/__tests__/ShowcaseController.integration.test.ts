import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import ShowcaseController from '../ShowcaseController'
import { Application } from 'express'
import { ShowcaseStatus } from '../../types'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import ShowcaseService from '../../services/ShowcaseService'
import TenantService from '../../services/TenantService'
import { ShowcaseRequest } from 'bc-wallet-openapi'
import { PGlite } from '@electric-sql/pglite'
import DatabaseService from '../../services/DatabaseService'
import {
  createMockDatabaseService,
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestIssuer,
  createTestPersona,
  createTestTenant,
  setupTestDatabase,
} from './dbTestData'
import { createApiFullTestData, createApiTestScenario } from './apiTestData'
import supertest = require('supertest')

describe('ShowcaseController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any
  let tenantId: string

  beforeAll(async () => {
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(TenantRepository)
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(ScenarioRepository)
    Container.get(ShowcaseRepository)
    Container.get(TenantRepository)
    Container.get(ShowcaseService)
    Container.get(TenantService)

    // Create a tenant for testing
    const tenant = await createTestTenant('test-tenant')
    tenantId = tenant.id

    app = createExpressServer({
      controllers: [ShowcaseController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a showcase with tenant association', async () => {
    const testData = await createApiFullTestData(tenantId)
    const createResponse = await request.post('/showcases').send(testData.showcaseRequest).expect(201)

    const createdShowcase = createResponse.body.showcase
    expect(createdShowcase).toHaveProperty('id')
    expect(createdShowcase.name).toEqual('Test Showcase')
    expect(createdShowcase.tenantId).toEqual(tenantId)
    expect(createdShowcase.status).toEqual(ShowcaseStatus.ACTIVE)
    expect(createdShowcase.scenarios.length).toEqual(1)
    expect(createdShowcase.personas.length).toEqual(1)
    expect(createdShowcase.bannerImage).toBeDefined()
    expect(createdShowcase.completionMessage).toEqual('Congratulations on completing the showcase!')

    // 2. Retrieve all showcases
    const getAllResponse = await request.get('/showcases').expect(200)
    expect(getAllResponse.body.showcases).toBeInstanceOf(Array)
    expect(getAllResponse.body.showcases.length).toBe(1)
    expect(getAllResponse.body.showcases[0].tenantId).toEqual(tenantId)

    // 3. Retrieve the created showcase
    const getResponse = await request.get(`/showcases/${createdShowcase.slug}`).expect(200)
    expect(getResponse.body.showcase.name).toEqual('Test Showcase')
    expect(getResponse.body.showcase.tenantId).toEqual(tenantId)

    // 4. Update the showcase
    const updatedRequest = {
      ...testData.showcaseRequest,
      name: 'Updated Showcase Name',
      description: 'Updated showcase description',
      status: ShowcaseStatus.PENDING,
    }

    const updateResponse = await request.put(`/showcases/${createdShowcase.slug}`).send(updatedRequest).expect(200)
    const updatedShowcase = updateResponse.body.showcase

    expect(updateResponse.body.showcase.name).toEqual('Updated Showcase Name')
    expect(updateResponse.body.showcase.description).toEqual('Updated showcase description')
    expect(updateResponse.body.showcase.status).toEqual(ShowcaseStatus.PENDING)
    expect(updateResponse.body.showcase.tenantId).toEqual(tenantId)

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
      tenantId: '79a56be5-89bd-40dc-a6a7-fc035487e437',
      scenarios: [nonExistentId],
      personas: [nonExistentId],
      tenantId: tenantId,
    }

    await request.post('/showcases').send(invalidShowcaseRequest2).expect(404)
  })

  it('should validate tenant association when creating a showcase', async () => {
    const asset = await createTestAsset()
    const persona = await createTestPersona(asset)
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)
    const issuer = await createTestIssuer(asset, credentialDefinition, credentialSchema)

    const scenario = await createApiTestScenario(asset.id, persona.id, issuer.id)

    // Attempt to create a showcase with non-existent tenant
    const invalidTenantShowcaseRequest: ShowcaseRequest = {
      name: 'Invalid Tenant Showcase',
      description: 'Test description',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      personas: [persona.id],
      bannerImage: asset.id,
      tenantId: 'non-existent-tenant',
    }

    await request.post('/showcases').send(invalidTenantShowcaseRequest).expect(500)
  })
})
