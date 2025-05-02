import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { NewTenant, NewUser } from '../../../types'
import * as schema from '../../schema'
import TenantRepository from '../TenantRepository'
import UserRepository from '../UserRepository'

describe('Database tenant repository tests', (): void => {
  let client: PGlite
  let tenantRepository: TenantRepository
  let userRepository: UserRepository

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    Container.set({ id: UserRepository, type: UserRepository })
    userRepository = Container.get(UserRepository)
    tenantRepository = Container.get(TenantRepository)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save tenant to database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)

    expect(savedTenant).toBeDefined()
    expect(savedTenant.id).toEqual(tenant.id)
  })

  it('Should get tenant by id from database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)
    expect(savedTenant).toBeDefined()

    const fromDb = await tenantRepository.findById(savedTenant.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.id).toEqual(tenant.id)
  })

  it('Should get all tenants from database', async (): Promise<void> => {
    const tenant1: NewTenant = {
      id: 'test-tenant-id-1',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const tenant2: NewTenant = {
      id: 'test-tenant-id-2',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant1 = await tenantRepository.create(tenant1)
    expect(savedTenant1).toBeDefined()

    const savedTenant2 = await tenantRepository.create(tenant2)
    expect(savedTenant2).toBeDefined()

    const fromDb = await tenantRepository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete tenant from database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)
    expect(savedTenant).toBeDefined()

    await tenantRepository.delete(savedTenant.id)

    await expect(tenantRepository.findById(savedTenant.id)).rejects.toThrowError(
      `No tenant found for id: ${savedTenant.id}`,
    )
  })

  it('Should update tenant in database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)
    expect(savedTenant).toBeDefined()

    const newTenantId = 'updated-test-tenant-id'
    const updatedTenant = await tenantRepository.update(savedTenant.id, {
      id: newTenantId,
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    })

    expect(updatedTenant).toBeDefined()
    expect(updatedTenant.id).toEqual(newTenantId)
  })

  it('Should save tenant with users  to database', async (): Promise<void> => {
    const user1: NewUser = { id: '550e8400-e29b-41d4-a716-446655440000', userName: 'User 1' }
    const user2: NewUser = { id: '550e8400-e29b-41d4-a716-446655440001', userName: 'User 2' }

    await userRepository.create(user1)
    await userRepository.create(user2)

    const tenant: NewTenant = {
      id: 'test-tenant-id',
      users: [user1.id!, user2.id!],
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)

    expect(savedTenant).toBeDefined()
    expect(savedTenant.id).toEqual(tenant.id)
    expect(savedTenant.users).toHaveLength(2)
    expect(savedTenant.users).toEqual([
      {
        clientId: null,
        createdAt: expect.any(Date),
        id: '550e8400-e29b-41d4-a716-446655440000',
        issuer: null,
        updatedAt: expect.any(Date),
        userName: 'User 1',
      },
      {
        clientId: null,
        createdAt: expect.any(Date),
        id: '550e8400-e29b-41d4-a716-446655440001',
        issuer: null,
        updatedAt: expect.any(Date),
        userName: 'User 2',
      },
    ])
  })

  it('Should update tenant with users  in database', async (): Promise<void> => {
    const user1: NewUser = { id: '550e8400-e29b-41d4-a716-446655440000', userName: 'User 1' }
    const user2: NewUser = { id: '550e8400-e29b-41d4-a716-446655440001', userName: 'User 2' }
    const user3: NewUser = { id: '550e8400-e29b-41d4-a716-446655440002', userName: 'User 3' }

    await userRepository.create(user1)
    await userRepository.create(user2)
    await userRepository.create(user3)

    const tenant: NewTenant = {
      id: 'test-tenant-id',
      users: [user1.id!, user2.id!],
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    }

    const savedTenant = await tenantRepository.create(tenant)

    const updatedTenant = await tenantRepository.update(savedTenant.id, {
      id: savedTenant.id,
      users: [user3.id!],
      realm: 'test_realm',
      clientId: 'test_client_id',
      clientSecret: 'super_secret',
    })

    expect(updatedTenant).toBeDefined()
    expect(updatedTenant.id).toEqual(savedTenant.id)
    expect(updatedTenant.users).toHaveLength(1)
    expect(updatedTenant.users).toEqual([
      {
        clientId: null,
        createdAt: expect.any(Date),
        id: '550e8400-e29b-41d4-a716-446655440002',
        issuer: null,
        updatedAt: expect.any(Date),
        userName: 'User 3',
      },
    ])
  })
})
