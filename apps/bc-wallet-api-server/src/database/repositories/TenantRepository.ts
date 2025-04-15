import { eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'
import { NotFoundError } from '../../errors'
import DatabaseService from '../../services/DatabaseService'
import { tenants, tenantsToUsers, users } from '../schema'
import { NewTenant, RepositoryDefinition, Tenant, User } from '../../types'
import UserRepository from './UserRepository'

@Service()
class TenantRepository implements RepositoryDefinition<Tenant, NewTenant> {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly userRepository: UserRepository) {}

  public async create(newTenant: NewTenant): Promise<Tenant> {
    let usersResult: User[] = []
    const connection = await this.databaseService.getConnection()
    return connection.transaction(async (tx): Promise<Tenant> => {
      const [tenantResult] = await tx
        .insert(tenants)
        .values({
          ...newTenant,
        })
        .returning()

      if (newTenant.users && newTenant.users.length > 0) {
        const tenantPromises = newTenant.users.map(async (user) => this.userRepository.findById(user))
        await Promise.all(tenantPromises)

        const tenantsToUsersResult = await tx
          .insert(tenantsToUsers)
          .values(
            newTenant.users.map((userId: string) => ({
              tenant: tenantResult.id,
              user: userId,
            })),
          )
          .returning()

        usersResult = await tx.query.users.findMany({
          where: inArray(
            users.id,
            tenantsToUsersResult.map((item) => item.user).filter((id): id is string => id !== null),
          )
        })
      }
      return {
        ...tenantResult,
        users: usersResult
      }
    })
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(tenants).where(eq(tenants.id, id))
  }

  public async update(id: string, newTenant: NewTenant): Promise<Tenant> {
    await this.findById(id)

    let usersResult: User[] = []

    const connection = await this.databaseService.getConnection()

    return connection.transaction(async (tx): Promise<Tenant> => {
      const [tenantResult] = await tx
        .update(tenants)
        .set(newTenant)
        .where(eq(tenants.id, id))
        .returning()

      await tx.delete(tenantsToUsers).where(eq(tenantsToUsers.user, id))

      if (newTenant.users && newTenant.users.length > 0) {
        const tenantPromises = newTenant.users.map(async (user) => this.userRepository.findById(user))
        await Promise.all(tenantPromises)

        const tenantsToUsersResult = await tx
          .insert(tenantsToUsers)
          .values(
            newTenant.users.map((userId: string) => ({
              tenant: tenantResult.id,
              user: userId,
            })),
          )
          .returning()

        usersResult = await tx.query.users.findMany({
          where: inArray(
            users.id,
            tenantsToUsersResult.map((item) => item.user).filter((id): id is string => id !== null),
          )
        })
      }
      return {
        ...tenantResult,
        users: usersResult
      }
    })
  }

  public async findById(id: string): Promise<Tenant> {
    const prepared = (await this.databaseService.getConnection()).query.tenants
      .findFirst({
        where: eq(tenants.id, id),
        with: {
          users: true,
        },
      })
      .prepare('statement_name')

    const tenant = await prepared.execute()

    if (!tenant) {
      return Promise.reject(new NotFoundError(`No tenant found for id: ${id}`))
    }

    return {
      ...tenant,
      users: tenant.users.map((item: any) => item.user),
    }
  }

  public async findAll(): Promise<Tenant[]> {
    const connection = await this.databaseService.getConnection()
    const tenants = await connection.query.tenants.findMany()
    const tenantIds = tenants.map((s: any) => s.id)

    const users = await connection.query.tenantsToUsers.findMany({
      where: inArray(tenantsToUsers.tenant, tenantIds),
      with: {
        user: true,
      },
    })

    const usersMap = new Map<string, any[]>()
    for (const item of users) {
      const key = item.tenant
      if (!usersMap.has(key)) {
        usersMap.set(key, [])
      }
      usersMap.get(key)!.push(item)
    }

    return tenants.map((tenant) => {
      return {
        ...tenant,
        users: (usersMap.get(tenant.id) || []).map((item: any) => item.user),
      }
    })
  }
}

export default TenantRepository
