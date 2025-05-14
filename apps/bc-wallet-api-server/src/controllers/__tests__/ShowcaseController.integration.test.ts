import './setup-env'
import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { ShowcaseRequest } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestIssuer,
  createTestPersona,
  createTestTenant,
  createTestUser,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import ShowcaseService from '../../services/ShowcaseService'
import TenantService from '../../services/TenantService'
import { ShowcaseStatus } from '../../types'
import ShowcaseController from '../ShowcaseController'
import { createApiFullTestData, createApiTestScenario } from './apiTestData'
import { registerMockServicesByInterface, setupRabbitMQ, setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')
import { MockSessionService } from './MockSessionService'

describe('ShowcaseController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any
  let tenantId: string
  let sessionService: MockSessionService

  beforeAll(async () => {
    await setupRabbitMQ()
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    await registerMockServicesByInterface(database)
    useContainer(Container)
    Container.get(TenantRepository)
    sessionService = Container.get(MockSessionService)
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

    sessionService.setCurrentTenant(tenant)
    sessionService.setCurrentUser(await createTestUser('test-user'))

    app = createExpressServer({
      controllers: [ShowcaseController],
      authorizationChecker: () => true,
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
      tenantId: tenantId,
      scenarios: [nonExistentId],
      personas: [nonExistentId],
    }

    await request.post('/showcases').send(invalidShowcaseRequest2).expect(404)
  })

  it('should validate tenant association when creating a showcase', async () => {
    const asset = await createTestAsset()
    const persona = await createTestPersona(asset)
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)
    const issuer = await createTestIssuer(asset, credentialDefinition, credentialSchema)

    const scenario = await createApiTestScenario(asset.id, persona.id, issuer.id, credentialDefinition.id)

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

  it('should duplicate a showcase', async () => {
    const testData = await createApiFullTestData(tenantId)
    const createResponse = await request.post('/showcases').send(testData.showcaseRequest).expect(201)
    const createdShowcase = createResponse.body.showcase

    const duplicateResponse = await request
      .post(`/showcases/${createdShowcase.slug}/duplicate`)
      .send({ tenantId: tenantId })
      .expect(201)

    const duplicatedShowcase = duplicateResponse.body.showcase

    expect(duplicatedShowcase.id).not.toEqual(createdShowcase.id)
    expect(duplicatedShowcase.name).toEqual(`${createdShowcase.name} (Copy)`)
    expect(duplicatedShowcase.tenantId).toEqual(createdShowcase.tenantId)
    expect(duplicatedShowcase.status).toEqual(createdShowcase.status)
    expect(duplicatedShowcase.scenarios.length).toEqual(createdShowcase.scenarios.length)
    expect(duplicatedShowcase.personas.length).toEqual(createdShowcase.personas.length)
    expect(duplicatedShowcase.bannerImage).toEqual(createdShowcase.bannerImage)
    expect(duplicatedShowcase.completionMessage).toEqual(createdShowcase.completionMessage)

    // Delete the duplicated showcase
    await request.delete(`/showcases/${duplicatedShowcase.slug}`).expect(204)

    // Verify the showcase is deleted
    await request.get(`/showcases/${duplicatedShowcase.slug}`).expect(404)
  })
})
