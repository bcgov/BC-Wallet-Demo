import { eq, inArray } from 'drizzle-orm'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import { DatabaseService } from '../../services/DatabaseService'
import { NewUser, RepositoryDefinition, User, Tenant } from '../../types'
import { users, tenantsToUsers, tenants } from '../schema'
import TenantRepository from './TenantRepository'

@Service()
export class UserRepository implements RepositoryDefinition<User, NewUser> {
  public constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantRepository: TenantRepository,
  ) {}

  public async create(newUser: NewUser): Promise<User> {
    let tenantsResult: Tenant[] = []
    const connection = await this.databaseService.getConnection()

    return connection.transaction(async (tx): Promise<User> => {
      const [userResult] = await tx.insert(users).values(newUser).returning()

      if (newUser.tenants && newUser.tenants.length > 0) {
        const tenantPromises = newUser.tenants.map(async (tenantId) =>
          this.tenantRepository.findById(tenantId)
        )
        await Promise.all(tenantPromises)

        const tenantsToUsersResult = await tx
          .insert(tenantsToUsers)
          .values(
            newUser.tenants.map((tenantId: string) => ({
              user: userResult.id,
              tenant: tenantId,
            })),
          )
          .returning()

        tenantsResult = await tx.query.tenants.findMany({
          where: inArray(
            tenants.id,
            tenantsToUsersResult.map((item) => item.tenant).filter((id): id is string => id !== null)
          ),
        })
      }

      return {
        ...userResult,
        tenants: tenantsResult,
      }
    })
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(users).where(eq(users.id, id))
  }

  public async update(id: string, newUser: NewUser): Promise<User> {
    await this.findById(id)

    let tenantsResult: Tenant[] = []
    const connection = await this.databaseService.getConnection()

    return connection.transaction(async (tx): Promise<User> => {
      const [userResult] = await tx
        .update(users)
        .set(newUser)
        .where(eq(users.id, id))
        .returning()

      await tx.delete(tenantsToUsers).where(eq(tenantsToUsers.user, id))

      if (newUser.tenants && newUser.tenants.length > 0) {
        const tenantPromises = newUser.tenants.map(async (tenantId) =>
          this.tenantRepository.findById(tenantId)
        )
        await Promise.all(tenantPromises)

        const tenantsToUsersResult = await tx
          .insert(tenantsToUsers)
          .values(
            newUser.tenants.map((tenantId: string) => ({
              user: userResult.id,
              tenant: tenantId,
            }))
          )
          .returning()

        tenantsResult = await tx.query.tenants.findMany({
          where: inArray(
            tenants.id,
            tenantsToUsersResult.map((item) => item.tenant).filter((id): id is string => id !== null)
          ),
        })
      }

      return {
        ...userResult,
        tenants: tenantsResult,
      }
    })
  }

  public async findById(id: string): Promise<User> {
    const prepared = (await this.databaseService.getConnection()).query.users
      .findFirst({
        where: eq(users.id, id),
        with: {
          tenants: true,
        },
      })
      .prepare('statement_name')

    const user = await prepared.execute()

    if (!user) {
      return Promise.reject(new NotFoundError(`No user found for id: ${id}`))
    }

    return {
      ...user,
      tenants: user.tenants.map((item: any) => item.tenant),
    }
  }

  public async findByUserName(userName: string): Promise<User> {
    const prepared = (await this.databaseService.getConnection()).query.users
      .findFirst({
        where: eq(users.userName, userName),
        with: {
          tenants: true,
        },
      })
      .prepare('find_user_by_username')

    const user = await prepared.execute()

    if (!user) {
      return Promise.reject(new NotFoundError(`No user found for userName: ${userName}`))
    }

    return {
      ...user,
      tenants: user.tenants.map((item: any) => item.tenant),
    }
  }

  public async findAll(): Promise<User[]> {
    const connection = await this.databaseService.getConnection()
    const usersList = await connection.query.users.findMany()
    const userIds = usersList.map((u: any) => u.id)

    const tenants = await connection.query.tenantsToUsers.findMany({
      where: inArray(tenantsToUsers.user, userIds),
      with: {
        tenant: true,
      },
    })

    const tenantsMap = new Map<string, any[]>()
    for (const item of tenants) {
      const key = item.user
      if (!tenantsMap.has(key)) {
        tenantsMap.set(key, [])
      }
      tenantsMap.get(key)!.push(item)
    }

    return usersList.map((user) => {
      return {
        ...user,
        tenants: (tenantsMap.get(user.id) || []).map((item: any) => item.tenant),
      }
    })
  }
}

export default UserRepository
