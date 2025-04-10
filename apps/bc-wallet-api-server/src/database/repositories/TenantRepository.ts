import { eq } from 'drizzle-orm'
import { Service } from 'typedi'
import DatabaseService from '../../services/DatabaseService'
import { NotFoundError } from '../../errors'
import { tenants } from '../schema'
import { NewTenant, RepositoryDefinition, Tenant } from '../../types'

@Service()
class TenantRepository implements RepositoryDefinition<Tenant, NewTenant> {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(newTenant: NewTenant): Promise<Tenant> {
    const [result] = await (await this.databaseService.getConnection()).insert(tenants).values(newTenant).returning()

    return result
  }

  async delete(id: string): Promise<void> {
    await this.findById(id)
    await (await this.databaseService.getConnection()).delete(tenants).where(eq(tenants.id, id))
  }

  async update(id: string, tenantData: NewTenant): Promise<Tenant> {
    await this.findById(id)
    const [result] = await (await this.databaseService.getConnection())
      .update(tenants)
      .set(tenantData)
      .where(eq(tenants.id, id))
      .returning()

    return result
  }

  async findById(id: string): Promise<Tenant> {
    const [result] = await (await this.databaseService.getConnection()).select().from(tenants).where(eq(tenants.id, id))

    if (!result) {
      return Promise.reject(new NotFoundError(`No tenant found for id: ${id}`))
    }

    return result
  }

  async findAll(): Promise<Tenant[]> {
    return (await this.databaseService.getConnection()).select().from(tenants)
  }
}

export default TenantRepository
