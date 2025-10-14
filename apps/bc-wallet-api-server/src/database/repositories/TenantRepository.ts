import { and, eq, inArray } from 'drizzle-orm'
import { NotFoundError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import DatabaseService from '../../services/DatabaseService'
import { NewTenant, RepositoryDefinition, Tenant } from '../../types'
import { tenants, tenantsToUsers } from '../schema'
import UserRepository from './UserRepository'

@Service()
class TenantRepository implements RepositoryDefinition<Tenant, NewTenant> {
  public constructor(private readonly databaseService: DatabaseService) {}

  // Problem with circular references: https://github.com/typestack/typedi/blob/develop/docs/README.md#problem-with-circular-references
  @Inject((type) => UserRepository)
  private userRepository!: UserRepository

  public async create(newTenant: NewTenant): Promise<Tenant> {
    const connection = await this.databaseService.getConnection()
    if (newTenant.users && newTenant.users.length > 0) {
      await Promise.all(newTenant.users.map(async (userId) => this.userRepository.findById(userId)))
    }
    return connection.transaction(
      async (tx): Promise<Tenant> => {
        const [tenantResult] = await tx
          .insert(tenants)
          .values({
            ...newTenant,
          })
          .returning()

        if (newTenant.users && newTenant.users.length > 0) {
          await tx
            .insert(tenantsToUsers)
            .values(
              newTenant.users.map((userId: string) => ({
                tenant: tenantResult.id,
                user: userId,
              })),
            )
            .returning()
        }

        const tenant = await tx.query.tenants.findFirst({
          where: eq(tenants.id, tenantResult.id),
          with: {
            users: {
              with: {
                user: true,
              },
            },
            issuers: {
              with: {
                cds: true,
                css: true,
              },
            },
            relyingParties: {
              with: {
                cds: true,
              },
            },
          },
        })

        if (!tenant) {
          return Promise.reject(new Error(`Failed to fetch created tenant: ${tenantResult.id}`))
        }

        return {
          ...tenant,
          users: tenant.users.map((item: any) => item.user),
          issuers: tenant.issuers.map((issuer: any) => ({
            ...issuer,
            logo: null,
            credentialDefinitions: issuer.cds.map((item: any) => ({ id: item.credentialDefinition })),
            credentialSchemas: issuer.css.map((item: any) => ({ id: item.credentialSchema })),
          })),
          relyingParties: tenant.relyingParties.map((rp: any) => ({
            ...rp,
            logo: null,
            credentialDefinitions: rp.cds.map((item: any) => ({ id: item.credentialDefinition })),
          })),
        }
      },
      {
        isolationLevel: 'read committed',
        accessMode: 'read write',
        deferrable: true,
      },
    )
  }

  public async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(tenants).where(eq(tenants.id, id))
  }

  public async update(id: string, newTenant: NewTenant): Promise<Tenant> {
    await this.findById(id)

    const connection = await this.databaseService.getConnection()
    if (newTenant.users && newTenant.users.length > 0) {
      await Promise.all(newTenant.users.map(async (user) => this.userRepository.findById(user)))
    }
    return connection.transaction(async (tx): Promise<Tenant> => {
      const [tenantResult] = await tx.update(tenants).set(newTenant).where(eq(tenants.id, id)).returning()

      await tx.delete(tenantsToUsers).where(eq(tenantsToUsers.tenant, id))

      if (newTenant.users && newTenant.users.length > 0) {
        await tx
          .insert(tenantsToUsers)
          .values(
            newTenant.users.map((userId: string) => ({
              tenant: tenantResult.id,
              user: userId,
            })),
          )
          .returning()
      }

      const tenant = await tx.query.tenants.findFirst({
        where: eq(tenants.id, tenantResult.id),
        with: {
          users: {
            with: {
              user: true,
            },
          },
          issuers: {
            with: {
              cds: true,
              css: true,
            },
          },
          relyingParties: {
            with: {
              cds: true,
            },
          },
        },
      })

      if (!tenant) {
        return Promise.reject(new Error(`Failed to fetch updated tenant: ${tenantResult.id}`))
      }

      return {
        ...tenant,
        users: tenant.users.map((item: any) => item.user),
        issuers: tenant.issuers.map((issuer: any) => ({
          ...issuer,
          logo: null,
          credentialDefinitions: issuer.cds.map((item: any) => ({ id: item.credentialDefinition })),
          credentialSchemas: issuer.css.map((item: any) => ({ id: item.credentialSchema })),
        })),
        relyingParties: tenant.relyingParties.map((rp: any) => ({
          ...rp,
          logo: null,
          credentialDefinitions: rp.cds.map((item: any) => ({ id: item.credentialDefinition })),
        })),
      }
    })
  }

  public async findById(id: string): Promise<Tenant> {
    const prepared = (await this.databaseService.getConnection()).query.tenants
      .findFirst({
        where: eq(tenants.id, id),
        with: {
          users: true,
          issuers: {
            with: {
              cds: true,
              css: true,
            },
          },
          relyingParties: {
            with: {
              cds: true,
            },
          },
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
      issuers: tenant.issuers.map((issuer: any) => ({
        ...issuer,
        logo: null,
        credentialDefinitions: issuer.cds.map((item: any) => ({ id: item.credentialDefinition })),
        credentialSchemas: issuer.css.map((item: any) => ({ id: item.credentialSchema })),
      })),
      relyingParties: tenant.relyingParties.map((rp: any) => ({
        ...rp,
        logo: null,
        credentialDefinitions: rp.cds.map((item: any) => ({ id: item.credentialDefinition })),
      })),
    }
  }

  public async findByIssuerAndClientId(issuer: string, clientId: string): Promise<Tenant> {
    const prepared = (await this.databaseService.getConnection()).query.tenants
      .findFirst({
        where: and(eq(tenants.id, clientId), eq(tenants.oidcIssuer, issuer)),
      })
      .prepare('find_tenant_by_issuer_and_clientId')

    const tenant = await prepared.execute()

    if (!tenant) {
      return Promise.reject(new NotFoundError(`No tenant found for issuer: ${issuer} and clientId: ${clientId}`))
    }
    return tenant
  }

  public async findAll(): Promise<Tenant[]> {
    const connection = await this.databaseService.getConnection()
    const tenantsResult = await connection.query.tenants.findMany({
      with: {
        issuers: {
          with: {
            cds: true,
            css: true,
          },
        },
        relyingParties: {
          with: {
            cds: true,
          },
        },
      },
    })

    const tenantIds = tenantsResult.map((s: any) => s.id)

    const users = await connection.query.tenantsToUsers.findMany({
      where: inArray(tenantsToUsers.tenant, tenantIds),
      with: {
        user: true,
      },
    })

    const usersMap = users.reduce((map, item) => {
      const key = item.tenant
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(item)
      return map
    }, new Map<string, any[]>())

    return tenantsResult.map((tenant) => {
      return {
        ...tenant,
        users: (usersMap.get(tenant.id) || []).map((item: any) => item.user),
        issuers: tenant.issuers.map((issuer: any) => ({
          ...issuer,
          logo: null,
          credentialDefinitions: issuer.cds.map((item: any) => ({ id: item.credentialDefinition })),
          credentialSchemas: issuer.css.map((item: any) => ({ id: item.credentialSchema })),
        })),
        relyingParties: tenant.relyingParties.map((rp: any) => ({
          ...rp,
          logo: null,
          credentialDefinitions: rp.cds.map((item: any) => ({ id: item.credentialDefinition })),
        })),
      }
    })
  }
}

export default TenantRepository
