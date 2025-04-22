import { encryptString, decryptString } from 'bc-wallet-adapter-client-api'
import * as process from 'node:process'
import { InternalServerError } from 'routing-controllers'
import { Service } from 'typedi'

import TenantRepository from '../database/repositories/TenantRepository'
import { Tenant, NewTenant } from '../types'

@Service()
class TenantService {
  public constructor(private readonly tenantRepository: TenantRepository) {}

  public getTenants = async (): Promise<Tenant[]> => {
    return this.tenantRepository.findAll()
  }

  public getTenant = async (id: string): Promise<Tenant> => {
    return this.tenantRepository.findById(id)
  }

  public getTenantByRealmAndClientId = async (realm: string, clientId: string): Promise<Tenant> => {
    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }
    const tenant = await this.tenantRepository.findByRealmAndClientId(realm, clientId)
    return {
      ...tenant,
      clientSecret: decryptString(tenant.clientSecret, process.env.ENCRYPTION_KEY),
    }
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    const newTenant = {
      ...tenant,
      clientSecret: encryptString(tenant.clientSecret).encryptedBase64,
    }
    return this.tenantRepository.create(newTenant)
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    const newTenant = {
      ...tenant,
      clientSecret: encryptString(tenant.clientSecret).encryptedBase64,
    }
    return this.tenantRepository.update(id, newTenant)
  }

  public deleteTenant = async (id: string): Promise<void> => {
    return this.tenantRepository.delete(id)
  }
}

export default TenantService
