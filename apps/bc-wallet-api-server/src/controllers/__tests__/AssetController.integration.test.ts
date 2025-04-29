import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import { createMockDatabaseService } from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import AssetService from '../../services/AssetService'
import DatabaseService from '../../services/DatabaseService'
import AssetController from '../AssetController'
import { setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')

describe('AssetController Integration Tests', () => {
  let app: Application
  let request: any
  let client: PGlite

  beforeAll(async () => {
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(AssetRepository)
    Container.get(AssetService)
    app = createExpressServer({
      controllers: [AssetController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    Container.reset()
    await client.close()
  })

  it('should create, retrieve, update, and delete an asset', async () => {
    const createResponse = await request
      .post('/assets')
      .send({
        mediaType: 'image/png',
        content: 'binary data',
        fileName: 'test.png',
        description: 'Test asset',
      })
      .expect(201)
    const created = createResponse.body.asset
    expect(created).toHaveProperty('id')
    expect(created.fileName).toEqual('test.png')
    expect(created.description).toEqual('Test asset')

    const getResponse = await request.get(`/assets/${created.id}`).expect(200)
    expect(getResponse.body.asset.fileName).toEqual('test.png')
    expect(getResponse.body.asset.description).toEqual('Test asset')

    const allResponse = await request.get('/assets').expect(200)
    expect(Array.isArray(allResponse.body.assets)).toBe(true)
    expect(allResponse.body.assets.length).toBeGreaterThanOrEqual(1)

    const updateResponse = await request
      .put(`/assets/${created.id}`)
      .send({
        mediaType: 'image/png',
        content: 'binary data',
        fileName: 'updated.png',
        description: 'Updated asset',
      })
      .expect(200)
    expect(updateResponse.body.asset.fileName).toEqual('updated.png')
    expect(updateResponse.body.asset.description).toEqual('Updated asset')

    await request.delete(`/assets/${created.id}`).expect(204)
    await request.get(`/assets/${created.id}`).expect(404)
  })
})
