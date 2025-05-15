import './setup-env'
import './setup-mocks'
import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { CredentialDefinitionRequest, CredentialType, IdentifierType } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createTestAsset,
  createTestCredentialSchema,
  createTestTenant,
  createTestUser,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'
import TenantService from '../../services/TenantService'
import { CredentialDefinitionController } from '../CredentialDefinitionController'
import { registerMockServicesByInterface, setupRabbitMQ, setupTestDatabase } from './globalTestSetup'
import { MockSessionService } from './MockSessionService'
import supertest = require('supertest')

describe('CredentialDefinitionController Integration Tests', () => {
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
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(TenantRepository)
    Container.get(CredentialDefinitionService)
    Container.get(TenantService)
    sessionService = Container.get(MockSessionService)

    // Create a tenant for testing
    const tenant = await createTestTenant('test-tenant')
    tenantId = tenant.id

    sessionService.setCurrentTenant(tenant)
    sessionService.setCurrentUser(await createTestUser('test-user'))

    app = createExpressServer({
      controllers: [CredentialDefinitionController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a credential definition with tenant association', async () => {
    // Create prerequisite: an asset and a credential schema
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()

    // Create a credential definition
    const createResponse = await request
      .post('/credentials/definitions')
      .send({
        name: 'Test Credential',
        version: '1.0',
        identifierType: IdentifierType.Did,
        identifier: 'did:test:456',
        credentialSchema: credentialSchema.id,
        icon: asset.id,
        type: CredentialType.Anoncred,
        representations: [],
      } satisfies CredentialDefinitionRequest)
      .expect(201)
    const created = createResponse.body.credentialDefinition
    expect(created).toHaveProperty('id')
    expect(created.credentialSchema).toHaveProperty('id')
    expect(created.tenantId).toEqual(tenantId)

    // Retrieve the created definition
    const getResponse = await request.get(`/credentials/definitions/${created.id}`).expect(200)
    expect(getResponse.body.credentialDefinition.name).toEqual('Test Credential')
    expect(getResponse.body.credentialDefinition.tenantId).toEqual(tenantId)

    // Update the credential definition
    const updateResponse = await request
      .put(`/credentials/definitions/${created.id}`)
      .send({
        name: 'Updated Credential',
        version: '1.0',
        credentialSchema: credentialSchema.id,
        icon: asset.id,
        type: CredentialType.Anoncred,
        representations: [],
      } satisfies CredentialDefinitionRequest)
      .expect(200)
    expect(updateResponse.body.credentialDefinition.name).toEqual('Updated Credential')
    expect(updateResponse.body.credentialDefinition.tenantId).toEqual(tenantId)

    // Delete the credential definition
    await request.delete(`/credentials/definitions/${created.id}`).expect(204)

    // Verify deletion (assuming a 404 is returned when not found)
    await request.get(`/credentials/definitions/${created.id}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent credential definition
    await request.get(`/credentials/definitions/${nonExistentId}`).expect(404)
  })
})
