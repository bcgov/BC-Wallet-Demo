import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Container } from 'typedi'
import AssetRepository from '../UserRepository'
import DatabaseService from '../../../services/DatabaseService'
import * as schema from '../../schema'
import { IdentifierType, NewUser } from '../../../types'

describe('Database user repository tests', (): void => {
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

  it('Should save user to database', async (): Promise<void> => {
    const user: NewUser = {
      identifierType: IdentifierType.DID,
      identifier: 'test_identifier',
    }

    const savedUser = await repository.create(user)

    expect(savedUser).toBeDefined()
    expect(savedUser.identifier).toEqual(user.identifier)
  })

  it('Should get user by id from database', async (): Promise<void> => {
    const user: NewUser = {
      identifierType: IdentifierType.DID,
      identifier: 'test_identifier',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    const fromDb = await repository.findById(savedUser.id)

    expect(fromDb).toBeDefined()
    expect(fromDb!.identifier).toEqual(user.identifier)
  })

  it('Should get all users from database', async (): Promise<void> => {
    const user: NewUser = {
      identifierType: IdentifierType.DID,
      identifier: 'test_identifier',
    }

    const savedUser1 = await repository.create(user)
    expect(savedUser1).toBeDefined()

    const savedUser2 = await repository.create(user)
    expect(savedUser2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete user from database', async (): Promise<void> => {
    const user: NewUser = {
      identifierType: IdentifierType.DID,
      identifier: 'test_identifier',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    await repository.delete(savedUser.id)

    await expect(repository.findById(savedUser.id)).rejects.toThrowError(`No user found for id: ${savedUser.id}`)
  })

  it('Should update user in database', async (): Promise<void> => {
    const user: NewUser = {
      identifierType: IdentifierType.DID,
      identifier: 'test_identifier',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    const newUserIdentifier = 'new_test_identifier'
    const updatedUser = await repository.update(savedUser.id, { ...savedUser, identifier: newUserIdentifier })

    expect(updatedUser).toBeDefined()
    expect(updatedUser.identifier).toEqual(newUserIdentifier)
  })
})
