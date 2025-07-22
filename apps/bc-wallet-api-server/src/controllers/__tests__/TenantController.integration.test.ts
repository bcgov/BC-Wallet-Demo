import './setup-env'
import './setup-mocks'
import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { environment } from 'bc-wallet-adapter-client-api/dist/environment'
import { TenantRequest } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestIssuer,
  createTestPersona,
  createTestScenario,
  createTestTenant,
} from '../../database/repositories/__tests__/dbTestData'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import ShowcaseService from '../../services/ShowcaseService'
import TenantService from '../../services/TenantService'
import { ShowcaseStatus } from '../../types'
import TenantController from '../TenantController'
import { registerMockServicesByInterface, setupRabbitMQ, setupTestDatabase } from './globalTestSetup'
import { MockSessionService } from './MockSessionService'
import supertest = require('supertest')

describe('TenantController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any
  let sessionService: MockSessionService

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = environment.encryption.ENCRYPTION_KEY = 'F5XH4zeMFB6nLKY7g15kpkVEcxFkGokGbAKSPbzaTEwe'
    process.env.NONCE_SIZE = `${environment.encryption.NONCE_SIZE ?? 12}`
    await setupRabbitMQ()
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    await registerMockServicesByInterface(database)
    useContainer(Container)
    Container.get(TenantRepository)
    Container.get(TenantService)
    sessionService = Container.get(MockSessionService)
    app = createExpressServer({
      controllers: [TenantController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a tenant', async () => {
    // 1. Create a tenant
    const tenantRequest: TenantRequest = {
      id: 'test-tenant-1',
      tractionTenantId: 'a7d9b6bd-f263-4cf6-9b6d-cbc5f0e9f0c6',
      oidcIssuer: 'https://auth-server/auth/realms/test',
    }

    const createResponse = await request.post('/tenants').send(tenantRequest).expect(201)

    const createdTenant = createResponse.body.tenant
    expect(createdTenant).toHaveProperty('id')
    expect(createdTenant.id).toEqual('test-tenant-1')
    expect(createdTenant.tractionTenantId).toEqual('a7d9b6bd-f263-4cf6-9b6d-cbc5f0e9f0c6')
    expect(createdTenant.oidcIssuer).toEqual('https://auth-server/auth/realms/test')
    expect(createdTenant.createdAt).toBeDefined()

    // Check that default issuer and relying party were created
    expect(createdTenant.issuers).toHaveLength(1)
    expect(createdTenant.issuers[0].name).toEqual('Default Issuer for test-tenant-1')
    expect(createdTenant.relyingParties).toHaveLength(1)
    expect(createdTenant.relyingParties[0].name).toEqual('Default Relying Party for test-tenant-1')

    // 2. Retrieve all tenants
    const getAllResponse = await request.get('/tenants').expect(200)
    expect(getAllResponse.body.tenants).toBeInstanceOf(Array)
    expect(getAllResponse.body.tenants.length).toBe(1)

    // 4. Update the tenant
    const updatedRequest: TenantRequest = {
      id: createdTenant.id,
      oidcIssuer: 'https://auth-server/auth/realms/updated-test',
      tractionTenantId: 'b8e9c7ce-f374-4df7-8c7e-dcd6f1f0f1d7',
    }

    const updateResponse = await request.put(`/tenants/${createdTenant.id}`).send(updatedRequest).expect(200)
    const updatedTenant = updateResponse.body.tenant

    expect(updatedTenant.id).toEqual(createdTenant.id)
    expect(updatedTenant.oidcIssuer).toEqual('https://auth-server/auth/realms/updated-test')
    expect(updatedTenant.tractionTenantId).toEqual('b8e9c7ce-f374-4df7-8c7e-dcd6f1f0f1d7')

    // 5. Delete the tenant (use the original ID since it wasn't changed)
    await request.delete(`/tenants/${createdTenant.id}`).expect(204)

    // 6. Verify tenant deletion
    await request.get(`/tenants/${createdTenant.id}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentId = 'non-existent-tenant'

    // Try to get a non-existent tenant
    await request.get(`/tenants/${nonExistentId}`).expect(404)
  })

  it('should validate request data when creating a tenant', async () => {
    // Attempt to create a tenant with missing required fields
    const invalidTenantRequest = {
      // Missing id
    }

    await request.post('/tenants').send(invalidTenantRequest).expect(400)
  })

  it('should cascade delete showcases when a tenant is deleted', async () => {
    // Register the required services
    Container.get(ShowcaseRepository)
    Container.get(ShowcaseService)

    // Create test tenant
    const tenant = await createTestTenant('cascade-test-tenant')
    sessionService.setCurrentTenant(tenant)

    // Create test data
    const asset = await createTestAsset()
    const persona = await createTestPersona(asset)
    const schema = await createTestCredentialSchema()
    const definition = await createTestCredentialDefinition(asset, schema, tenant.id)
    const issuer = await createTestIssuer(asset, definition, schema, tenant.id)
    const scenario = await createTestScenario(asset, persona, issuer, definition.id, tenant.id)

    // Create a showcase associated with the tenant
    const showcaseService = Container.get(ShowcaseService)
    const showcase = await showcaseService.createShowcase({
      name: 'Test Cascade Showcase',
      description: 'Testing cascade delete',
      status: ShowcaseStatus.ACTIVE,
      hidden: false,
      scenarios: [scenario.id],
      personas: [persona.id],
      credentialDefinitions: [definition.id],
      bannerImage: asset.id,
      tenantId: tenant.id,
    })

    // Verify showcase was created
    const showcaseRepository = Container.get(ShowcaseRepository)
    // Get the showcase ID first, then use it to verify showcase exists
    const showcaseId = await showcaseRepository.findIdBySlug(showcase.slug, tenant.id)
    const showcaseBeforeDelete = await showcaseRepository.findById(showcaseId)
    expect(showcaseBeforeDelete).toBeDefined()

    // Delete the tenant
    await request.delete(`/tenants/${tenant.id}`).expect(204)

    // Verify tenant was deleted
    await request.get(`/tenants/${tenant.id}`).expect(404)

    // Verify showcase was also deleted (cascade)
    try {
      await showcaseRepository.findIdBySlug(showcase.slug, tenant.id)
      // Should not reach here
      fail('Showcase should have been deleted')
    } catch (error) {
      expect(error.message).toContain('No showcase found for slug: test-cascade-showcase')
    }
  })
})
