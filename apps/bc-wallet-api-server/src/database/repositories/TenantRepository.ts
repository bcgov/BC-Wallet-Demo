import { eq } from 'drizzle-orm'
import { Service } from 'typedi'

import { NotFoundError } from '../../errors'
import DatabaseService from '../../services/DatabaseService'
import { NewTenant, RepositoryDefinition, Tenant } from '../../types'
import { tenant } from '../schema'

@Service()
class TenantRepository implements RepositoryDefinition<Tenant, NewTenant> {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(newTenant: NewTenant): Promise<Tenant> {
    const [result] = await (await this.databaseService.getConnection()).insert(tenant).values(newTenant).returning()

    return result
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(tenant).where(eq(tenant.id, id))
  }

  async update(id: string, tenantData: NewTenant): Promise<Tenant> {
    await this.findById(id)
    const [result] = await (await this.databaseService.getConnection())
      .update(tenant)
      .set(tenantData)
      .where(eq(tenant.id, id))
      .returning()

    return result
  }

  async findById(id: string): Promise<Tenant> {
    const [result] = await (await this.databaseService.getConnection()).select().from(tenant).where(eq(tenant.id, id))

    if (!result) {
      return Promise.reject(new NotFoundError(`No tenant found for id: ${id}`))
    }

    return result
  }

  async findAll(): Promise<Tenant[]> {
    return (await this.databaseService.getConnection()).select().from(tenant)
  }
}

export default TenantRepository
