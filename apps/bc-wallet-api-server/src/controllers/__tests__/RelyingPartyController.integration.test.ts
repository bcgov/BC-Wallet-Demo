import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import RelyingPartyController from '../RelyingPartyController'
import { Application } from 'express'
import { CredentialType, IdentifierType, RelyingPartyType } from '../../types'
import { RelyingPartyRequest } from 'bc-wallet-openapi'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import RelyingPartyService from '../../services/RelyingPartyService'
import { PGlite } from '@electric-sql/pglite'
import DatabaseService from '../../services/DatabaseService'
import {
  createMockDatabaseService,
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  setupTestDatabase,
} from './dbTestData'
import supertest = require('supertest')

describe('RelyingPartyController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(RelyingPartyRepository)
    Container.get(RelyingPartyService)
    app = createExpressServer({
      controllers: [RelyingPartyController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a relying party', async () => {
    // Create prerequisites using test utilities
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    // 1. Create a relying party
    const relyingPartyRequest: RelyingPartyRequest = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const createResponse = await request.post('/roles/relying-parties').send(relyingPartyRequest).expect(201)

    const createdRelyingParty = createResponse.body.relyingParty
    expect(createdRelyingParty).toHaveProperty('id')
    expect(createdRelyingParty.name).toEqual('Test Relying Party')
    expect(createdRelyingParty.type).toEqual(RelyingPartyType.ARIES)
    expect(createdRelyingParty.credentialDefinitions.length).toBe(1)
    expect(createdRelyingParty.credentialDefinitions[0].id).toEqual(credentialDefinition.id)

    // 2. Retrieve all relying parties
    const getAllResponse = await request.get('/roles/relying-parties').expect(200)
    expect(getAllResponse.body.relyingParties).toBeInstanceOf(Array)
    expect(getAllResponse.body.relyingParties.length).toBe(1)

    // 3. Retrieve the created relying party
    const getResponse = await request.get(`/roles/relying-parties/${createdRelyingParty.id}`).expect(200)
    expect(getResponse.body.relyingParty.name).toEqual('Test Relying Party')

    // 4. Update the relying party
    const updateResponse = await request
      .put(`/roles/relying-parties/${createdRelyingParty.id}`)
      .send({
        ...relyingPartyRequest,
        name: 'Updated Relying Party Name',
      })
      .expect(200)

    expect(updateResponse.body.relyingParty.name).toEqual('Updated Relying Party Name')

    // 5. Delete the relying party
    await request.delete(`/roles/relying-parties/${createdRelyingParty.id}`).expect(204)

    // 6. Verify relying party deletion
    await request.get(`/roles/relying-parties/${createdRelyingParty.id}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent relying party
    await request.get(`/roles/relying-parties/${nonExistentId}`).expect(404)

    // Try to update a non-existent relying party
    const updateRequest: RelyingPartyRequest = {
      name: 'Non-existent Relying Party',
      description: 'This relying party does not exist',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [],
    }

    await request.put(`/roles/relying-parties/${nonExistentId}`).send(updateRequest).expect(404)

    // Try to delete a non-existent relying party
    await request.delete(`/roles/relying-parties/${nonExistentId}`).expect(404)
  })

  it('should validate request data when creating a relying party', async () => {
    // Attempt to create a relying party with missing required fields
    const invalidRelyingPartyRequest = {
      // Missing name, description, etc.
    }

    await request.post('/roles/relying-parties').send(invalidRelyingPartyRequest).expect(400)

    // Attempt to create a relying party with a non-existent credential definition
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidRelyingPartyRequest2: RelyingPartyRequest = {
      name: 'Invalid Relying Party',
      description: 'Test description',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [nonExistentId],
    }

    await request.post('/roles/relying-parties').send(invalidRelyingPartyRequest2).expect(404)
  })

  it('should handle creating a relying party with multiple credential definitions', async () => {
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

    const relyingPartyRequest: RelyingPartyRequest = {
      name: 'Multi-Cred Relying Party',
      description: 'Relying party with multiple credential definitions',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
    }

    const createResponse = await request.post('/roles/relying-parties').send(relyingPartyRequest).expect(201)

    const createdRelyingParty = createResponse.body.relyingParty
    expect(createdRelyingParty).toHaveProperty('id')
    expect(createdRelyingParty.name).toEqual('Multi-Cred Relying Party')
    expect(createdRelyingParty.credentialDefinitions.length).toBe(2)

    // Verify that both credential definitions are included
    const credentialDefIds = createdRelyingParty.credentialDefinitions.map((def: { id: string }) => def.id)
    expect(credentialDefIds).toContain(credentialDefinition1.id)
    expect(credentialDefIds).toContain(credentialDefinition2.id)

    // Clean up by deleting the relying party
    await request.delete(`/roles/relying-parties/${createdRelyingParty.id}`).expect(204)
  })
})
