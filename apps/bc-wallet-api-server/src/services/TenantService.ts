import { Service } from 'typedi'
import { Tenant, NewTenant } from '../types'
import TenantRepository from '../database/repositories/TenantRepository'

@Service()
class TenantService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  public getTenants = async (): Promise<Tenant[]> => {
    return this.tenantRepository.findAll()
  }

  public getTenant = async (id: string): Promise<Tenant> => {
    return this.tenantRepository.findById(id)
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    return this.tenantRepository.create(tenant)
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    return this.tenantRepository.update(id, tenant)
  }

  public deleteTenant = async (id: string): Promise<void> => {
    return this.tenantRepository.delete(id)
  }
}

export default TenantService
