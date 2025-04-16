import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { NewAsset } from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../AssetRepository'

describe('Database asset repository tests', (): void => {
  let client: PGlite
  let repository: AssetRepository

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(AssetRepository)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save asset to database', async (): Promise<void> => {
    const asset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }

    const savedAsset = await repository.create(asset)

    expect(savedAsset).toBeDefined()
    expect(savedAsset.mediaType).toEqual(asset.mediaType)
    expect(savedAsset.fileName).toEqual(asset.fileName)
    expect(savedAsset.description).toEqual(asset.description)
    expect(savedAsset.content).toStrictEqual(asset.content)
  })

  it('Should get asset by id from database', async (): Promise<void> => {
    const asset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }

    const savedAsset = await repository.create(asset)
    expect(savedAsset).toBeDefined()

    const fromDb = await repository.findById(savedAsset.id)

    expect(fromDb).toBeDefined()
    expect(fromDb!.mediaType).toEqual(asset.mediaType)
    expect(fromDb!.fileName).toEqual(asset.fileName)
    expect(fromDb!.description).toEqual(asset.description)
    expect(fromDb!.content).toStrictEqual(asset.content)
  })

  it('Should get all assets from database', async (): Promise<void> => {
    const asset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }

    const savedAsset1 = await repository.create(asset)
    expect(savedAsset1).toBeDefined()

    const savedAsset2 = await repository.create(asset)
    expect(savedAsset2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete asset from database', async (): Promise<void> => {
    const asset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }

    const savedAsset = await repository.create(asset)
    expect(savedAsset).toBeDefined()

    await repository.delete(savedAsset.id)

    await expect(repository.findById(savedAsset.id)).rejects.toThrowError(`No asset found for id: ${savedAsset.id}`)
  })

  it('Should update asset in database', async (): Promise<void> => {
    const asset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }

    const savedAsset = await repository.create(asset)
    expect(savedAsset).toBeDefined()

    const newFileName = 'new_image.png'
    const updatedAsset = await repository.update(savedAsset.id, { ...savedAsset, fileName: newFileName })

    expect(updatedAsset).toBeDefined()
    expect(updatedAsset.mediaType).toEqual(asset.mediaType)
    expect(updatedAsset.fileName).toEqual(newFileName)
    expect(updatedAsset.description).toEqual(asset.description)
    expect(updatedAsset.content).toStrictEqual(asset.content)
  })
})
