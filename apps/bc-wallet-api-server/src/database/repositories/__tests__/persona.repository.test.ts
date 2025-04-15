import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { Asset, NewAsset, NewPersona } from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../AssetRepository'
import PersonaRepository from '../PersonaRepository'

describe('Database persona repository tests', (): void => {
  let client: PGlite
  let personaRepository: PersonaRepository
  let asset: Asset

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    personaRepository = Container.get(PersonaRepository)
    const assetRepository = Container.get(AssetRepository)
    const newAsset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }
    asset = await assetRepository.create(newAsset)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save persona to database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: true,
    }

    const savedPersona = await personaRepository.create(persona)

    expect(savedPersona).toBeDefined()
    expect(savedPersona.name).toEqual(persona.name)
    expect(savedPersona.slug).toEqual('john-doe')
    expect(savedPersona.role).toEqual(persona.role)
    expect(savedPersona.description).toEqual(persona.description)
    expect(savedPersona.hidden).toEqual(persona.hidden)
    expect(savedPersona.headshotImage).toBeDefined()
    expect(savedPersona.headshotImage!.id).toBeDefined()
    expect(savedPersona.headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(savedPersona.headshotImage!.fileName).toEqual(asset.fileName)
    expect(savedPersona.headshotImage!.description).toEqual(asset.description)
    expect(savedPersona.headshotImage!.content).toStrictEqual(asset.content)
    expect(savedPersona.bodyImage).toBeDefined()
    expect(savedPersona.bodyImage!.id).toBeDefined()
    expect(savedPersona.bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(savedPersona.bodyImage!.fileName).toEqual(asset.fileName)
    expect(savedPersona.bodyImage!.description).toEqual(asset.description)
    expect(savedPersona.bodyImage!.content).toStrictEqual(asset.content)
  })

  it('Should save persona without images to database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)

    expect(savedPersona).toBeDefined()
    expect(savedPersona.name).toEqual(persona.name)
    expect(savedPersona.role).toEqual(persona.role)
    expect(savedPersona.description).toEqual(persona.description)
    expect(savedPersona.headshotImage).toBeNull()
    expect(savedPersona.bodyImage).toBeNull()
  })

  it('Should throw error when saving persona with invalid headshot image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: unknownImageId,
      hidden: false,
    }

    await expect(personaRepository.create(persona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })

  it('Should throw error when saving persona with invalid body image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      bodyImage: unknownImageId,
      hidden: false,
    }

    await expect(personaRepository.create(persona)).rejects.toThrowError(`No asset found for id: ${unknownImageId}`)
  })

  it('Should get persona by id from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const fromDb = await personaRepository.findById(savedPersona.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(persona.name)
    expect(fromDb.role).toEqual(persona.role)
    expect(fromDb.description).toEqual(persona.description)
    expect(fromDb.headshotImage).toBeDefined()
    expect(fromDb.headshotImage!.id).toBeDefined()
    expect(fromDb.headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.headshotImage!.fileName).toEqual(asset.fileName)
    expect(fromDb.headshotImage!.description).toEqual(asset.description)
    expect(fromDb.headshotImage!.content).toStrictEqual(asset.content)
    expect(fromDb.bodyImage).toBeDefined()
    expect(fromDb.bodyImage!.id).toBeDefined()
    expect(fromDb.bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.bodyImage!.fileName).toEqual(asset.fileName)
    expect(fromDb.bodyImage!.description).toEqual(asset.description)
    expect(fromDb.bodyImage!.content).toStrictEqual(asset.content)
  })

  it('Should get all personas from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona1 = await personaRepository.create(persona)
    expect(savedPersona1).toBeDefined()

    const savedPersona2 = await personaRepository.create(persona)
    expect(savedPersona2).toBeDefined()

    const fromDb = await personaRepository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete persona from database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    await personaRepository.delete(savedPersona.id)

    await expect(personaRepository.findById(savedPersona.id)).rejects.toThrowError(
      `No persona found for id: ${savedPersona.id}`,
    )
  })

  it('Should update persona in database', async (): Promise<void> => {
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: true,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const newName = 'Jane Doe'
    const updatedPersona = await personaRepository.update(savedPersona.id, {
      ...savedPersona,
      headshotImage: savedPersona.headshotImage!.id,
      bodyImage: savedPersona.bodyImage!.id,
      name: newName,
    })

    expect(updatedPersona).toBeDefined()
    expect(updatedPersona.name).toEqual(newName)
    expect(updatedPersona.slug).toEqual('jane-doe')
    expect(updatedPersona.role).toEqual(persona.role)
    expect(updatedPersona.description).toEqual(persona.description)
    expect(updatedPersona.hidden).toEqual(persona.hidden)
    expect(updatedPersona.headshotImage).toBeDefined()
    expect(updatedPersona.headshotImage!.id).toBeDefined()
    expect(updatedPersona.headshotImage!.mediaType).toEqual(asset.mediaType)
    expect(updatedPersona.headshotImage!.fileName).toEqual(asset.fileName)
    expect(updatedPersona.headshotImage!.description).toEqual(asset.description)
    expect(updatedPersona.headshotImage!.content).toStrictEqual(asset.content)
    expect(updatedPersona.bodyImage).toBeDefined()
    expect(updatedPersona.bodyImage!.id).toBeDefined()
    expect(updatedPersona.bodyImage!.mediaType).toEqual(asset.mediaType)
    expect(updatedPersona.bodyImage!.fileName).toEqual(asset.fileName)
    expect(updatedPersona.bodyImage!.description).toEqual(asset.description)
    expect(updatedPersona.bodyImage!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when updating persona with invalid headshot image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const updatedPersona: NewPersona = {
      ...savedPersona,
      headshotImage: unknownImageId,
      bodyImage: savedPersona.bodyImage!.id,
    }

    await expect(personaRepository.update(savedPersona.id, updatedPersona)).rejects.toThrowError(
      `No asset found for id: ${unknownImageId}`,
    )
  })

  it('Should throw error when updating persona with invalid body image id', async (): Promise<void> => {
    const unknownImageId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const persona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }

    const savedPersona = await personaRepository.create(persona)
    expect(savedPersona).toBeDefined()

    const updatedPersona: NewPersona = {
      ...savedPersona,
      headshotImage: savedPersona.headshotImage!.id,
      bodyImage: unknownImageId,
    }

    await expect(personaRepository.update(savedPersona.id, updatedPersona)).rejects.toThrowError(
      `No asset found for id: ${unknownImageId}`,
    )
  })
})
