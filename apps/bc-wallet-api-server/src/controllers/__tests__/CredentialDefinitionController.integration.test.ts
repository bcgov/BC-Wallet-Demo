import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { CredentialDefinitionController } from '../CredentialDefinitionController'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import AssetRepository from '../../database/repositories/AssetRepository'
import { Application } from 'express'
import { CredentialDefinitionRequest, CredentialType, IdentifierType } from 'bc-wallet-openapi'
import { PGlite } from '@electric-sql/pglite'
import DatabaseService from '../../services/DatabaseService'
import supertest = require('supertest')
import { createMockDatabaseService, createTestAsset, createTestCredentialSchema, setupTestDatabase } from './dbTestData'
import { MockSessionService } from './MockSessionService'

describe('CredentialDefinitionController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.set('ISessionService', Container.get(MockSessionService))
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(CredentialDefinitionService)
    app = createExpressServer({
      controllers: [CredentialDefinitionController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a credential definition', async () => {
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

    // Retrieve the created definition
    const getResponse = await request.get(`/credentials/definitions/${created.id}`).expect(200)
    expect(getResponse.body.credentialDefinition.name).toEqual('Test Credential')

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

    // Delete the credential definition
    await request.delete(`/credentials/definitions/${created.id}`).expect(204)

    // Verify deletion (assuming a 404 is returned when not found)
    await request.get(`/credentials/definitions/${created.id}`).expect(404)
  })
})
