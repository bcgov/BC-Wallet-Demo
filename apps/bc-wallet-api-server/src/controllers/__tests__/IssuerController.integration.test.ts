import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { IssuerRequest } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import IssuerService from '../../services/IssuerService'
import { CredentialType, IdentifierType } from '../../types'
import IssuerController from '../IssuerController'
import { createApiIssuerRequest } from './apiTestData'
import { registerMockServicesByInterface, setupRabbitMQ, setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')

describe('IssuerController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    await setupRabbitMQ()
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    await registerMockServicesByInterface(database)

    useContainer(Container)

    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(IssuerService)

    // Create Express server using routing-controllers
    app = createExpressServer({
      controllers: [IssuerController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    //await testDbContainer.stop()
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete an issuer', async () => {
    // Create prerequisites using test utilities
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    const issuerRequest = createApiIssuerRequest(asset.id, [credentialDefinition.id], [credentialSchema.id])
    // Add identifierType and identifier that aren't in the utility
    issuerRequest.identifierType = 'DID'
    issuerRequest.identifier = 'did:test:456'

    const createResponse = await request.post('/roles/issuers').send(issuerRequest).expect(201)

    const created = createResponse.body.issuer
    expect(created).toHaveProperty('id')
    expect(created.name).toEqual('Test Issuer')
    expect(created.description).toEqual('Test Issuer Description')
    expect(created.type).toEqual('ARIES')

    // Retrieve all issuers
    const getAllResponse = await request.get('/roles/issuers').expect(200)
    expect(getAllResponse.body.issuers).toBeInstanceOf(Array)
    expect(getAllResponse.body.issuers.length).toBeGreaterThan(0)

    // Retrieve the created issuer
    const getResponse = await request.get(`/roles/issuers/${created.id}`).expect(200)
    expect(getResponse.body.issuer.name).toEqual('Test Issuer')
    expect(getResponse.body.issuer.organization).toEqual('Test Organization')

    // Update the issuer
    const updateResponse = await request
      .put(`/roles/issuers/${created.id}`)
      .send({
        name: 'Updated Issuer',
        description: 'Updated Description',
        type: 'ARIES',
        organization: 'Updated Organization',
        logo: asset.id,
        credentialDefinitions: [credentialDefinition.id],
        credentialSchemas: [credentialSchema.id],
      } satisfies IssuerRequest)
      .expect(200)

    expect(updateResponse.body.issuer.name).toEqual('Updated Issuer')
    expect(updateResponse.body.issuer.description).toEqual('Updated Description')
    expect(updateResponse.body.issuer.organization).toEqual('Updated Organization')

    // Delete the issuer
    await request.delete(`/roles/issuers/${created.id}`).expect(204)

    // Verify deletion (should return 404)
    await request.get(`/roles/issuers/${created.id}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent issuer
    await request.get(`/roles/issuers/${nonExistentId}`).expect(404)

    // Try to update a non-existent issuer
    const updateRequest = createApiIssuerRequest('', [], [])

    await request.put(`/roles/issuers/${nonExistentId}`).send(updateRequest).expect(404)

    // Try to delete a non-existent issuer
    await request.delete(`/roles/issuers/${nonExistentId}`).expect(404)
  })

  it('should validate request data when creating a issuer', async () => {
    // Attempt to create an issuer with missing required fields
    const invalidIssuerRequest = {
      // Missing name, description, etc.
    }

    await request.post('/roles/issuers').send(invalidIssuerRequest).expect(400)

    // Attempt to create an issuer with a non-existent credential definition
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidIssuerRequest2 = createApiIssuerRequest('', [nonExistentId], [nonExistentId])

    await request.post('/roles/issuers').send(invalidIssuerRequest2).expect(404)
  })

  it('should handle creating a issuer with multiple credential definitions', async () => {
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialDefinition1 = await credentialDefinitionRepository.create({
      name: 'Test Definition 1',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const credentialDefinition2 = await credentialDefinitionRepository.create({
      name: 'Test Definition 2',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:456',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const issuerRequest = createApiIssuerRequest(
      asset.id,
      [credentialDefinition1.id, credentialDefinition2.id],
      [credentialSchema.id],
    )
    const createResponse = await request.post('/roles/issuers').send(issuerRequest).expect(201)

    const createdIssuer = createResponse.body.issuer
    expect(createdIssuer).toHaveProperty('id')
    expect(createdIssuer.name).toEqual('Test Issuer')
    expect(createdIssuer.credentialDefinitions.length).toBe(2)

    // Verify that both credential definitions are included
    const credentialDefIds = createdIssuer.credentialDefinitions.map((def: { id: string }) => def.id)
    expect(credentialDefIds).toContain(credentialDefinition1.id)
    expect(credentialDefIds).toContain(credentialDefinition2.id)

    // Clean up by deleting the issuer
    await request.delete(`/roles/issuers/${createdIssuer.id}`).expect(204)
  })
})
