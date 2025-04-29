import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { PersonaRequest } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import { createMockDatabaseService, createTestAsset } from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import DatabaseService from '../../services/DatabaseService'
import PersonaService from '../../services/PersonaService'
import PersonaController from '../PersonaController'
import { setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')

describe('PersonaController Integration Tests', () => {
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
    Container.get(PersonaRepository)
    Container.get(PersonaService)
    app = createExpressServer({
      controllers: [PersonaController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a persona', async () => {
    // Create asset for headshotImage and bodyImage
    const asset = await createTestAsset()

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
