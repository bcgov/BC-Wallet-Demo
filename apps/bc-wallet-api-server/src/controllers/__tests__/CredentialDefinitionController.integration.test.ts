import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { CredentialDefinitionController } from '../CredentialDefinitionController'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import AssetRepository from '../../database/repositories/AssetRepository'
import { Application } from 'express'
import { CredentialAttributeType, NewCredentialSchema, IdentifierType as DomainIdentifierType } from '../../types'
import { CredentialDefinitionRequest, IdentifierType, CredentialType } from 'bc-wallet-openapi'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'

describe('CredentialDefinitionController Integration Tests', () => {
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
    Container.get(CredentialDefinitionService)
    app = createExpressServer({
      controllers: [CredentialDefinitionController],
      authorizationChecker: () => true
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a credential definition', async () => {
    // Create prerequisite: an asset and a credential schema
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const newCredentialSchema: NewCredentialSchema = {
      name: 'example_name',
      version: 'example_version',
      identifierType: DomainIdentifierType.DID,
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
    }
    const credentialSchema = await credentialSchemaRepository.create(newCredentialSchema)

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
