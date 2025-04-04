import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { CredentialSchemaController } from '../CredentialSchemaController'
import { Application } from 'express'
import { CredentialAttributeType, CredentialSchemaRequest, IdentifierType, Source } from 'bc-wallet-openapi'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'

describe('CredentialSchemaController Integration Tests', () => {
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
    app = createExpressServer({
      controllers: [CredentialSchemaController],
      authorizationChecker: () => true
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a credential schema', async () => {
    // Create a credential schema
    const createResponse = await request
      .post('/credentials/schemas')
      .send({
        name: 'Test Schema',
        version: '1.0',
        identifierType: IdentifierType.Did,
        identifier: 'did:test:456',
        source: Source.Created,
        attributes: [{ name: 'attr1', value: 'value1', type: CredentialAttributeType.String }],
      } satisfies CredentialSchemaRequest)
      .expect(201)
    const created = createResponse.body.credentialSchema
    expect(created).toHaveProperty('id')

    // Retrieve the created schema
    const getResponse = await request.get(`/credentials/schemas/${created.id}`).expect(200)
    expect(getResponse.body.credentialSchema.name).toEqual('Test Schema')

    // Update the credential schema
    const updateResponse = await request
      .put(`/credentials/schemas/${created.id}`)
      .send({
        name: 'Updated Schema',
        version: '1.0',
        identifierType: IdentifierType.Did,
        identifier: 'did:test:456',
        source: Source.Imported,
        attributes: [{ name: 'attr1', value: 'value1', type: CredentialAttributeType.String }],
      } satisfies CredentialSchemaRequest)
      .expect(200)
    expect(updateResponse.body.credentialSchema.name).toEqual('Updated Schema')

    // Delete the credential schema
    await request.delete(`/credentials/schemas/${created.id}`).expect(204)

    // Verify deletion (assuming a 404 is returned when not found)
    await request.get(`/credentials/schemas/${created.id}`).expect(404)
  })
})
