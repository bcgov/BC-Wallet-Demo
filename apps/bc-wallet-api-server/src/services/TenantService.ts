import { decryptString, encryptString } from 'bc-wallet-adapter-client-api'
import * as process from 'node:process'
import { InternalServerError } from 'routing-controllers'
import { Service } from 'typedi'

import TenantRepository from '../database/repositories/TenantRepository'
import { NewTenant, Tenant, TenantType } from '../types'

@Service()
class TenantService {
  public constructor(private readonly tenantRepository: TenantRepository) {}

  public getTenants = async (): Promise<Tenant[]> => {
    const tenants = await this.tenantRepository.findAll()
    return Promise.all(
      tenants.map(async (tenant) => {
        if (!process.env.ENCRYPTION_KEY) {
          return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
        }
        return {
          ...tenant,
          clientSecret: decryptString(tenant.oidcClientSecret, tenant.nonceBase64 as string),
        }
      }),
    )
  }

  public getTenant = async (id: string): Promise<Tenant> => {
    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }
    const tenant = await this.tenantRepository.findById(id)
    return {
      ...tenant,
      oidcClientSecret: decryptString(tenant.oidcClientSecret, tenant.nonceBase64 as string),
    }
  }

  public getTenantByRealmAndClientId = async (realm: string, clientId: string): Promise<Tenant> => {
    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }
    const tenant = await this.tenantRepository.findByRealmAndClientId(realm, clientId)
    return {
      ...tenant,
      oidcClientSecret: decryptString(tenant.oidcClientSecret, tenant.nonceBase64 as string),
    }
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    const NONCE_SIZE = parseInt(process.env.NONCE_SIZE || '12') || 12
    const { encryptedBase64, nonceBase64 } = encryptString(tenant.oidcClientSecret, NONCE_SIZE)
    const newTenant = {
      ...tenant,
      clientSecret: encryptedBase64,
      nonceBase64,
    }
    return this.tenantRepository.create(newTenant)
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    try {
      const NONCE_SIZE = parseInt(process.env.NONCE_SIZE || '12') || 12
      const { encryptedBase64, nonceBase64 } = encryptString(tenant.oidcClientSecret, NONCE_SIZE)
      const newTenant = {
        ...tenant,
        clientSecret: encryptedBase64,
        nonceBase64,
      }
      return this.tenantRepository.update(id, newTenant)
    } catch (error) {
      return Promise.reject(new InternalServerError(`Error updating tenant: ${error}`))
    }
  }

  public deleteTenant = async (id: string): Promise<void> => {
    return this.tenantRepository.delete(id)
  }

  public async createRootTenant() {
    const realm = process.env.OIDC_ROOT_REALM
    const clientId = process.env.OIDC_ROOT_CLIENT_ID
    const clientSecret = process.env.OIDC_ROOT_CLIENT_SECRET
    if (!realm || !clientId || !clientSecret) {
      throw new Error('OIDC_ROOT_REALM, OIDC_ROOT_CLIENT_ID and OIDC_ROOT_CLIENT_SECRET must be set')
    }

    const rootTenant = await this.getTenantByRealmAndClientId(realm, clientId)
    if (rootTenant) {
      if (rootTenant.tenantType !== TenantType.ROOT) {
        return Promise.reject(Error('Configured root tenant is not actually a root tenant'))
      }
      return // It's already there
    }

    const newRootTenant: NewTenant = {
      tenantType: TenantType.ROOT,
      oidcRealm: realm,
      oidcClientId: clientId,
      oidcClientSecret: clientSecret,
    }
    return this.tenantRepository.create(newRootTenant)
  }
}

export default TenantService
