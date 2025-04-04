import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import AssetController from '../AssetController'
import AssetService from '../../services/AssetService'
import AssetRepository from '../../database/repositories/AssetRepository'
import { Application } from 'express'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'

describe('AssetController Integration Tests', () => {
  let app: Application
  let request: any
  let client: PGlite

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
    Container.get(AssetService)
    app = createExpressServer({
      controllers: [AssetController],
      authorizationChecker: () => true
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
