import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { TenantRequest } from 'bc-wallet-openapi'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
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
import * as schema from '../../database/schema'
import DatabaseService from '../../services/DatabaseService'
import ShowcaseService from '../../services/ShowcaseService'
import TenantService from '../../services/TenantService'
import { ShowcaseStatus } from '../../types'
import TenantController from '../TenantController'
import supertest = require('supertest')
import { MockSessionService } from './MockSessionService'

import { environment } from 'bc-wallet-adapter-client-api/dist/environment'

describe('TenantController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = environment.encryption.ENCRYPTION_KEY = 'F5XH4zeMFB6nLKY7g15kpkVEcxFkGokGbAKSPbzaTEwe'
    process.env.NONCE_SIZE = `${environment.encryption.NONCE_SIZE ?? 12}`

    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.set('ISessionService', Container.get(MockSessionService))
    Container.get(TenantRepository)
    Container.get(TenantService)
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
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const createResponse = await request.post('/tenants').send(tenantRequest).expect(201)

    const createdTenant = createResponse.body.tenant
    expect(createdTenant).toHaveProperty('id')
    expect(createdTenant.id).toEqual('test-tenant-1')
    expect(createdTenant.clientId).toEqual('test_client_id')
    expect(createdTenant.realm).toEqual('test_realm')
    expect(createdTenant.clientSecret).toBeDefined()
    expect(createdTenant.createdAt).toBeDefined()

    // 2. Retrieve all tenants
    const getAllResponse = await request.get('/tenants').expect(200)
    expect(getAllResponse.body.tenants).toBeInstanceOf(Array)
    expect(getAllResponse.body.tenants.length).toBe(1)

    // 3. Retrieve the created tenant
    const getResponse = await request.get(`/tenants/${createdTenant.id}`).expect(200)
    expect(getResponse.body.tenant.id).toEqual('test-tenant-1')

    // 4. Update the tenant
    const updatedRequest = {
      id: 'updated-tenant-1',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const updateResponse = await request.put(`/tenants/${createdTenant.id}`).send(updatedRequest).expect(200)
    const updatedTenant = updateResponse.body.tenant

    expect(updatedTenant.id).toEqual('updated-tenant-1')

    // 5. Delete the tenant
    await request.delete(`/tenants/${updatedTenant.id}`).expect(204)

    // 6. Verify tenant deletion
    await request.get(`/tenants/${updatedTenant.id}`).expect(404)
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

    // Create test data
    const asset = await createTestAsset()
    const persona = await createTestPersona(asset)
    const schema = await createTestCredentialSchema()
    const definition = await createTestCredentialDefinition(asset, schema)
    const issuer = await createTestIssuer(asset, definition, schema)
    const scenario = await createTestScenario(asset, persona, issuer, definition.id)

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
    const showcaseId = await showcaseRepository.findIdBySlug(showcase.slug)
    const showcaseBeforeDelete = await showcaseRepository.findById(showcaseId)
    expect(showcaseBeforeDelete).toBeDefined()

    // Delete the tenant
    await request.delete(`/tenants/${tenant.id}`).expect(204)

    // Verify tenant was deleted
    await request.get(`/tenants/${tenant.id}`).expect(404)

    // Verify showcase was also deleted (cascade)
    try {
      await showcaseRepository.findIdBySlug(showcase.slug)
      // Should not reach here
      fail('Showcase should have been deleted')
    } catch (error) {
      expect(error.message).toContain('No showcase found for slug: test-cascade-showcase')
    }
  })
})
