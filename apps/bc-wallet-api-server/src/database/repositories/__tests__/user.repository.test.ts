import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { NewTenant, NewUser, TenantType } from '../../../types'
import * as schema from '../../schema'
import TenantRepository from '../TenantRepository'
import UserRepository from '../UserRepository'

describe('Database user repository tests', (): void => {
  let client: PGlite
  let userRepository: UserRepository
  let tenantRepository: TenantRepository

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    tenantRepository = Container.get(TenantRepository)
    userRepository = Container.get(UserRepository)
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

    const savedUser = await userRepository.create(user)

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

    const savedUser = await userRepository.create(user)
    expect(savedUser).toBeDefined()

    const fromDb = await userRepository.findById(savedUser.id)

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

    const savedUser1 = await userRepository.create(user)
    expect(savedUser1).toBeDefined()

    const savedUser2 = await userRepository.create(user)
    expect(savedUser2).toBeDefined()

    const fromDb = await userRepository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete user from database', async (): Promise<void> => {
    const user: NewUser = {
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
    }

    const savedUser = await userRepository.create(user)
    expect(savedUser).toBeDefined()

    await userRepository.delete(savedUser.id)

    await expect(userRepository.findById(savedUser.id)).rejects.toThrowError(`No user found for id: ${savedUser.id}`)
  })

  it('Should update user in database', async (): Promise<void> => {
    const user: NewUser = {
      userName: 'test_user',
      issuer: 'https://auth-server.example.com/auth/realms/BC',
      clientId: 'showcase-tenantA',
    }

    const savedUser = await userRepository.create(user)
    expect(savedUser).toBeDefined()

    const newClientId = 'showcase-tenantB'
    const updatedUser = await userRepository.update(savedUser.id, {
      ...savedUser,
      clientId: newClientId,
      tenants: undefined,
    })

    expect(updatedUser).toBeDefined()
    expect(updatedUser.clientId).toEqual(newClientId)
  })

  it('Should save user with tenants to database', async (): Promise<void> => {
    const tenant: NewTenant = {
      tenantType: TenantType.SHOWCASE,
      id: 'test-tenant-id',
      oidcIssuer: 'https://auth-server/auth/realms/test',
    }
    const savedTenant = await tenantRepository.create(tenant)
    expect(savedTenant).toBeDefined()

    const user: NewUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'Test User',
      tenants: [savedTenant.id],
    }

    const savedUser = await userRepository.create(user)

    expect(savedUser).toBeDefined()
    expect(savedUser.id).toEqual(user.id)
    expect(savedUser.userName).toEqual(user.userName)
    expect(savedUser.tenants).toHaveLength(1)
    expect(savedUser.tenants).toEqual([
      expect.objectContaining({
        createdAt: expect.any(Date),
        deletedAt: null,
        id: 'test-tenant-id',
        updatedAt: expect.any(Date),
      }),
    ])
  })

  it('Should update user with tenants in database', async (): Promise<void> => {
    const tenant1: NewTenant = {
      id: 'test-tenant-id-1',
      tenantType: TenantType.SHOWCASE,
      oidcIssuer: 'https://auth-server/auth/realms/test',
    }
    const tenant2: NewTenant = {
      id: 'test-tenant-id-2',
      tenantType: TenantType.SHOWCASE,
      oidcIssuer: 'https://auth-server/auth/realms/test',
    }

    const savedTenant1 = await tenantRepository.create(tenant1)
    const savedTenant2 = await tenantRepository.create(tenant2)
    expect(savedTenant1).toBeDefined()
    expect(savedTenant2).toBeDefined()

    const user: NewUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userName: 'Test User',
      tenants: [savedTenant1.id],
    }

    const savedUser = await userRepository.create(user)
    expect(savedUser).toBeDefined()
    expect(savedUser.tenants).toHaveLength(1)
    expect(savedUser.tenants).toEqual([
      {
        createdAt: expect.any(Date),
        deletedAt: null,
        id: 'test-tenant-id-1',
        nonceBase64: null,
        oidcIssuer: 'https://auth-server/auth/realms/test',
        tenantType: 'SHOWCASE',
        tractionApiUrl: null,
        tractionApiKey: null,
        tractionTenantId: null,
        tractionWalletId: null,
        updatedAt: expect.any(Date),
      },
    ])

    const updatedUser = await userRepository.update(savedUser.id, {
      ...savedUser,
      tenants: [savedTenant2.id],
    })

    expect(updatedUser).toBeDefined()
    expect(updatedUser.id).toEqual(savedUser.id)
    expect(updatedUser.tenants).toHaveLength(1)
    expect(updatedUser.tenants).toEqual([
      expect.objectContaining({
        id: 'test-tenant-id-2',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        deletedAt: null,
      }),
    ])
  })
})
