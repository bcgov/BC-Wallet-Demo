import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { NewUser } from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../UserRepository'

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
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC', // from iss claim
      clientId: 'showcase-tenantA', // from azp claim
    }

    const savedUser = await repository.create(user)

    expect(savedUser).toBeDefined()
    expect(savedUser.userName).toEqual(user.userName)
    expect(savedUser.issuer).toEqual(user.issuer)
    expect(savedUser.clientId).toEqual(user.clientId)
  })

  it('Should get user by id from database', async (): Promise<void> => {
    const user: NewUser = {
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    const fromDb = await repository.findById(savedUser.id)

    expect(fromDb).toBeDefined()
    expect(fromDb!.userName).toEqual(user.userName)
    expect(fromDb!.issuer).toEqual(user.issuer)
    expect(fromDb!.clientId).toEqual(user.clientId)
  })

  it('Should get all users from database', async (): Promise<void> => {
    const user: NewUser = {
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
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
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    await repository.delete(savedUser.id)

    await expect(repository.findById(savedUser.id)).rejects.toThrowError(`No user found for id: ${savedUser.id}`)
  })

  it('Should update user in database', async (): Promise<void> => {
    const user: NewUser = {
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
    }

    const savedUser = await repository.create(user)
    expect(savedUser).toBeDefined()

    const newClientId = 'showcase-tenantB'
    const updatedUser = await repository.update(savedUser.id, {
      ...savedUser,
      clientId: newClientId,
      tenants: undefined,
    })

    expect(updatedUser).toBeDefined()
    expect(updatedUser.clientId).toEqual(newClientId)
  })
})
