import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import PersonaController from '../PersonaController'
import PersonaService from '../../services/PersonaService'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import AssetRepository from '../../database/repositories/AssetRepository'
import { Application } from 'express'
import { PersonaRequest } from 'bc-wallet-openapi'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'

describe('PersonaController Integration Tests', () => {
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
    Container.get(PersonaRepository)
    Container.get(PersonaService)
    app = createExpressServer({
      controllers: [PersonaController],
      authorizationChecker: () => true
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a persona', async () => {
    // Create asset for headshotImage and bodyImage
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    // Create a persona
    const createResponse = await request
      .post('/personas')
      .send({
        name: 'Test Persona',
        role: 'Test Role',
        description: 'Test Persona Description',
        headshotImage: asset.id,
        bodyImage: asset.id,
        hidden: false,
      } satisfies PersonaRequest)
      .expect(201)

    const created = createResponse.body.persona
    expect(created).toHaveProperty('id')
    expect(created.name).toEqual('Test Persona')
    expect(created.role).toEqual('Test Role')
    expect(created.description).toEqual('Test Persona Description')
    expect(created.hidden).toEqual(false)

    // Retrieve all personas
    const getAllResponse = await request.get('/personas').expect(200)
    expect(Array.isArray(getAllResponse.body.personas)).toBeTruthy()
    expect(getAllResponse.body.personas.length).toBeGreaterThan(0)

    // Retrieve the created persona by id
    const getResponse = await request.get(`/personas/${created.slug}`).expect(200)
    expect(getResponse.body.persona.name).toEqual('Test Persona')
    expect(getResponse.body.persona.role).toEqual('Test Role')

    // Update the persona
    const updateResponse = await request
      .put(`/personas/${created.slug}`)
      .send({
        name: 'Updated Persona',
        role: 'Updated Role',
        description: 'Updated Persona Description',
        headshotImage: asset.id,
        bodyImage: asset.id,
        hidden: true,
      } satisfies PersonaRequest)
      .expect(200)
    const updatedPersona = updateResponse.body.persona

    expect(updateResponse.body.persona.name).toEqual('Updated Persona')
    expect(updateResponse.body.persona.role).toEqual('Updated Role')
    expect(updateResponse.body.persona.description).toEqual('Updated Persona Description')
    expect(updateResponse.body.persona.hidden).toEqual(true)

    // Delete the persona
    await request.delete(`/personas/${updatedPersona.slug}`).expect(204)

    // Verify deletion (should return 404)
    await request.get(`/personas/${updatedPersona.slug}`).expect(404)
  })
})
