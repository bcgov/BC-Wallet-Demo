import { decryptString, encryptString } from 'bc-wallet-adapter-client-api'
import * as process from 'node:process'
import { HttpError, InternalServerError } from 'routing-controllers'
import { Service } from 'typedi'

import TenantRepository from '../database/repositories/TenantRepository'
import { NewTenant, Tenant, TenantType } from '../types'

const oidcIssuer = process.env.OIDC_ROOT_ISSUER_URL!
const oidcClientId = process.env.OIDC_ROOT_CLIENT_ID!
const oidcClientSecret = process.env.OIDC_ROOT_CLIENT_SECRET!
if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
  throw new Error('OIDC_ROOT_ISSUER_URL, OIDC_ROOT_CLIENT_ID and OIDC_ROOT_CLIENT_SECRET must be set')
}

const NONCE_SIZE = parseInt(process.env.NONCE_SIZE || '12') || 12

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
          ...(tenant.tractionApiKey && {
            tractionApiKey: decryptString(tenant.tractionApiKey, tenant.nonceBase64 as string),
          }),
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
      ...(tenant.tractionApiKey && {
        tractionApiKey: decryptString(tenant.tractionApiKey, tenant.nonceBase64 as string),
      }),
    }
  }

  public getTenantByIssuerAndClientId = async (issuer: string, clientId: string): Promise<Tenant> => {
    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }
    const tenant = await this.tenantRepository.findByIssuerAndClientId(issuer, clientId)
    return {
      ...tenant,
      ...(tenant.tractionApiKey && {
        tractionApiKey: decryptString(tenant.tractionApiKey, tenant.nonceBase64 as string),
      }),
    }
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    if (!tenant.tractionApiKey) {
      return this.tenantRepository.create(tenant)
    } else {
      const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE)
      const newTenant = {
        ...tenant,
        tractionApiKey: encryptedApiKeyBase64,
        nonceBase64,
      }
      return this.tenantRepository.create(newTenant)
    }
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    try {
      const currentTenant = await this.tenantRepository.findById(id)
      if (!tenant.tractionApiKey) {
        return this.tenantRepository.update(id, tenant)
      } else {
        const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE)
        const newTenant = {
          ...tenant,
          tenantType: currentTenant.tenantType,
          oidcClientSecret: encryptedApiKeyBase64,
          nonceBase64,
        }
        return this.tenantRepository.update(id, newTenant)
      }
    } catch (error) {
      return Promise.reject(new InternalServerError(`Error updating tenant: ${error}`))
    }
  }

  public deleteTenant = async (id: string): Promise<void> => {
    return this.tenantRepository.delete(id)
  }

  public async createRootTenant() {
    try {
      const rootTenant = await this.getTenantByIssuerAndClientId(oidcIssuer, oidcClientId)
      if (rootTenant.tenantType !== TenantType.ROOT) {
        return Promise.reject(Error('Configured root tenant is not actually a root tenant'))
      }
      return rootTenant // Return the existing tenant instead of undefined
    } catch (e) {
      if (e instanceof HttpError && e.httpCode === 404) {
        // Fixed type check syntax
        const newRootTenant: NewTenant = {
          id: oidcClientId,
          tenantType: TenantType.ROOT,
          oidcIssuer: oidcIssuer,
        }
        return this.tenantRepository.create(newRootTenant)
      } else {
        return Promise.reject(e)
      }
    }
  }
}

export default TenantService
