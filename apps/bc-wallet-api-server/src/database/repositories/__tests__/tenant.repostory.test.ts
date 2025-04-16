import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import { NewTenant } from '../../../types'
import * as schema from '../../schema'
import TenantRepository from '../TenantRepository'

describe('Database tenant repository tests', (): void => {
  let client: PGlite
  let repository: TenantRepository

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(TenantRepository)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save tenant to database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
    }

    const savedTenant = await repository.create(tenant)

    expect(savedTenant).toBeDefined()
    expect(savedTenant.id).toEqual(tenant.id)
  })

  it('Should get tenant by id from database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
    }

    const savedTenant = await repository.create(tenant)
    expect(savedTenant).toBeDefined()

    const fromDb = await repository.findById(savedTenant.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.id).toEqual(tenant.id)
  })

  it('Should get all tenants from database', async (): Promise<void> => {
    const tenant1: NewTenant = {
      id: 'test-tenant-id-1',
    }

    const tenant2: NewTenant = {
      id: 'test-tenant-id-2',
    }

    const savedTenant1 = await repository.create(tenant1)
    expect(savedTenant1).toBeDefined()

    const savedTenant2 = await repository.create(tenant2)
    expect(savedTenant2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete tenant from database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
    }

    const savedTenant = await repository.create(tenant)
    expect(savedTenant).toBeDefined()

    await repository.delete(savedTenant.id)

    await expect(repository.findById(savedTenant.id)).rejects.toThrowError(`No tenant found for id: ${savedTenant.id}`)
  })

  it('Should update tenant in database', async (): Promise<void> => {
    const tenant: NewTenant = {
      id: 'test-tenant-id',
    }

    const savedTenant = await repository.create(tenant)
    expect(savedTenant).toBeDefined()

    const newTenantId = 'updated-test-tenant-id'
    const updatedTenant = await repository.update(savedTenant.id, { id: newTenantId })

    expect(updatedTenant).toBeDefined()
    expect(updatedTenant.id).toEqual(newTenantId)
  })
})
