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
    const tenants = await this.tenantRepository.findAll()
    return Promise.all(
      tenants.map(async (tenant) => {
        if (!process.env.ENCRYPTION_KEY) {
          return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
        }
        return {
          ...tenant,
          clientSecret: decryptString(tenant.clientSecret, tenant.nonceBase64 as string),
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
      clientSecret: decryptString(tenant.clientSecret, tenant.nonceBase64 as string),
    }
  }

  public getTenantByRealmAndClientId = async (realm: string, clientId: string): Promise<Tenant> => {
    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }
    const tenant = await this.tenantRepository.findByRealmAndClientId(realm, clientId)
    return {
      ...tenant,
      clientSecret: decryptString(tenant.clientSecret, tenant.nonceBase64 as string),
    }
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    if (process.env.NONCE_SIZE) {
      const { encryptedBase64, nonceBase64 } = encryptString(tenant.clientSecret, parseInt(process.env.NONCE_SIZE))
      const newTenant = {
        ...tenant,
        clientSecret: encryptedBase64,
        nonceBase64,
      }
      return this.tenantRepository.create(newTenant)
    } else {
      return Promise.reject(new InternalServerError(`No nonce size set: ${process.env.NONCE_SIZE}`))
    }
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    if (process.env.NONCE_SIZE) {
      const { encryptedBase64, nonceBase64 } = encryptString(tenant.clientSecret, parseInt(process.env.NONCE_SIZE))
      const newTenant = {
        ...tenant,
        clientSecret: encryptedBase64,
        nonceBase64,
      }
      return this.tenantRepository.update(id, newTenant)
    } else {
      return Promise.reject(new InternalServerError(`No nonce size set: ${process.env.NONCE_SIZE}`))
    }
  }

  public deleteTenant = async (id: string): Promise<void> => {
    return this.tenantRepository.delete(id)
  }
}

export default TenantService
