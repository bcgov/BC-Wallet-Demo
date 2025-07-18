import { decryptString, encryptString } from 'bc-wallet-adapter-client-api'
import * as process from 'node:process'
import { HttpError, InternalServerError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import RelyingPartyRepository from '../database/repositories/RelyingPartyRepository'
import TenantRepository from '../database/repositories/TenantRepository'
import { IssuerType, NewTenant, RelyingPartyType, Tenant, TenantType } from '../types'
import { ISessionService } from '../types/services/session'

const oidcIssuer = process.env.OIDC_ROOT_ISSUER_URL!
const oidcClientId = process.env.OIDC_ROOT_CLIENT_ID!
const oidcClientSecret = process.env.OIDC_ROOT_CLIENT_SECRET!
if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
  throw new Error('OIDC_ROOT_ISSUER_URL, OIDC_ROOT_CLIENT_ID and OIDC_ROOT_CLIENT_SECRET must be set')
}

const NONCE_SIZE = parseInt(process.env.NONCE_SIZE || '12') || 12

@Service()
class TenantService {
  public constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly issuerRepository: IssuerRepository,
    private readonly relyingPartyRepository: RelyingPartyRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public getTenants = async (): Promise<Tenant[]> => {
    const tenants = await this.tenantRepository.findAll()

    // Non-root users can only read oidcIssuer
    const currentTenant = this.sessionService.getCurrentTenant()
    if (!currentTenant || currentTenant.tenantType !== TenantType.ROOT) {
      return Promise.all(
        tenants.map(async (tenant) => {
          return this.redactedTenantFrom(tenant)
        }),
      )
    }

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

  public getTenant = async (id: string, internal: boolean = false): Promise<Tenant> => {
    const tenant = await this.tenantRepository.findById(id)

    // Ensure default issuer and relying party exist
    await this.ensureDefaultIssuer(id)
    await this.ensureDefaultRelyingParty(id)

    // Non-root users can only read oidcIssuer
    const currentTenant = this.sessionService.getCurrentTenant()
    if (!internal && (!currentTenant || currentTenant.tenantType !== TenantType.ROOT)) {
      return this.redactedTenantFrom(tenant)
    }

    if (!process.env.ENCRYPTION_KEY) {
      return Promise.reject(new InternalServerError(`No encryption key set: ${process.env.ENCRYPTION_KEY}`))
    }

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

    // Ensure default issuer and relying party exist
    await this.ensureDefaultIssuer(tenant.id)
    await this.ensureDefaultRelyingParty(tenant.id)

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
      const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE) // FIXME oidcClientSecret too!
      const newTenant = {
        ...tenant,
        tractionApiKey: encryptedApiKeyBase64,
        nonceBase64,
      }
      const createdTenant = await this.tenantRepository.create(newTenant)

      // Create default issuer and relying party
      await this.ensureDefaultIssuer(createdTenant.id)
      await this.ensureDefaultRelyingParty(createdTenant.id)

      return createdTenant
    }
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    try {
      const currentTenant = await this.tenantRepository.findById(id)
      if (!tenant.tractionApiKey) {
        return this.tenantRepository.update(id, {
          ...tenant,
          id: currentTenant.id,
          tenantType: currentTenant.tenantType,
        })
      } else {
        const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE)
        const newTenant = {
          ...tenant,
          id: currentTenant.id,
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

  private redactedTenantFrom(tenant: Tenant) {
    return {
      id: tenant.id,
      tenantType: tenant.tenantType,
      oidcIssuer: tenant.oidcIssuer,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      deletedAt: tenant.deletedAt,
      issuers: tenant.issuers,
      relyingParties: tenant.relyingParties,
      tractionTenantId: null,
      tractionApiUrl: null,
      tractionWalletId: null,
      tractionApiKey: null,
      nonceBase64: null,
    } satisfies Tenant
  }

  private async ensureDefaultIssuer(tenantId: string): Promise<void> {
    // Check if tenant already has an issuer
    const tenant = await this.tenantRepository.findById(tenantId)
    if (tenant.issuers && tenant.issuers.length > 0) {
      return
    }

    // Create default issuer
    await this.issuerRepository.create({
      name: `Default Issuer for ${tenantId}`,
      type: IssuerType.ARIES,
      description: 'Default issuer created automatically',
      credentialDefinitions: [],
      credentialSchemas: [],
      tenantId: tenantId,
    })
  }

  private async ensureDefaultRelyingParty(tenantId: string): Promise<void> {
    // Check if tenant already has a relying party
    const tenant = await this.tenantRepository.findById(tenantId)
    if (tenant.relyingParties && tenant.relyingParties.length > 0) {
      return
    }

    // Create default relying party
    await this.relyingPartyRepository.create({
      name: `Default Relying Party for ${tenantId}`,
      type: RelyingPartyType.ARIES,
      description: 'Default relying party created automatically',
      credentialDefinitions: [],
      tenantId: tenantId,
    })
  }
}

export default TenantService
