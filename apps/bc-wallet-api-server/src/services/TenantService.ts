import { decryptString, encryptString } from 'bc-wallet-adapter-client-api'
import * as process from 'node:process'
import { HttpError, InternalServerError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import IssuerRepository from '../database/repositories/IssuerRepository'
import RelyingPartyRepository from '../database/repositories/RelyingPartyRepository'
import TenantRepository from '../database/repositories/TenantRepository'
import { IssuerType, NewTenant, RelyingPartyType, Tenant, TenantType } from '../types'
import { ISessionService } from '../types/services/session'
import { createRequestLogger } from '../utils/logger'

const oidcIssuer = process.env.OIDC_ROOT_ISSUER_URL!
const oidcClientId = process.env.OIDC_ROOT_CLIENT_ID!
const oidcClientSecret = process.env.OIDC_ROOT_CLIENT_SECRET!
if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
  throw new Error('OIDC_ROOT_ISSUER_URL, OIDC_ROOT_CLIENT_ID and OIDC_ROOT_CLIENT_SECRET must be set')
}

const NONCE_SIZE = parseInt(process.env.NONCE_SIZE || '12') || 12

@Service()
class TenantService {
  private readonly logger = createRequestLogger('TenantService')

  public constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly issuerRepository: IssuerRepository,
    private readonly relyingPartyRepository: RelyingPartyRepository,
    @Inject('ISessionService') private readonly sessionService: ISessionService,
  ) {}

  public getTenants = async (): Promise<Tenant[]> => {
    this.logger.info('Retrieving all tenants')
    try {
      const tenants = await this.tenantRepository.findAll()
      this.logger.info({ count: tenants.length }, 'Successfully retrieved tenants')

      // Non-root users can only read oidcIssuer
      const currentTenant = this.sessionService.getCurrentTenant()
      if (!currentTenant || currentTenant.tenantType !== TenantType.ROOT) {
        this.logger.debug('Returning redacted tenant information for non-root user')
        return Promise.all(
          tenants.map(async (tenant) => {
            return this.redactedTenantFrom(tenant)
          }),
        )
      }

      this.logger.debug('Returning full tenant information for root user')
      return Promise.all(
        tenants.map(async (tenant) => {
          if (!process.env.ENCRYPTION_KEY) {
            this.logger.error('No encryption key set for tenant decryption')
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
    } catch (error) {
      this.logger.error({ error }, 'Failed to retrieve tenants')
      throw error
    }
  }

  public getTenant = async (id: string, internal: boolean = false): Promise<Tenant> => {
    const tenant = await this.tenantRepository.findById(id)

    // Ensure default issuer and relying party exist
    await this.ensureDefaultIssuer(tenant)
    await this.ensureDefaultRelyingParty(tenant)

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
    await this.ensureDefaultIssuer(tenant)
    await this.ensureDefaultRelyingParty(tenant)

    return {
      ...tenant,
      ...(tenant.tractionApiKey && {
        tractionApiKey: decryptString(tenant.tractionApiKey, tenant.nonceBase64 as string),
      }),
    }
  }

  public createTenant = async (tenant: NewTenant): Promise<Tenant> => {
    if (!tenant.tractionApiKey) {
      const createdTenant = await this.tenantRepository.create(tenant)

      // Create default issuer and relying party
      await this.ensureDefaultIssuer(createdTenant)
      await this.ensureDefaultRelyingParty(createdTenant)

      return createdTenant
    } else {
      const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE) // FIXME oidcClientSecret too!
      const newTenant = {
        ...tenant,
        tractionApiKey: encryptedApiKeyBase64,
        nonceBase64,
      }
      const createdTenant = await this.tenantRepository.create(newTenant)

      // Create default issuer and relying party
      await this.ensureDefaultIssuer(createdTenant)
      await this.ensureDefaultRelyingParty(createdTenant)

      return createdTenant
    }
  }

  public updateTenant = async (id: string, tenant: NewTenant): Promise<Tenant> => {
    try {
      const currentTenant = await this.tenantRepository.findById(id)

      const updateData = {
        ...tenant,
        id: currentTenant.id,
        tenantType: currentTenant.tenantType,
      }

      if (!tenant.tractionApiKey) {
        return this.tenantRepository.update(id, updateData)
      } else {
        const { encryptedApiKeyBase64, nonceBase64 } = encryptString(tenant.tractionApiKey, NONCE_SIZE)
        const newTenant = {
          ...updateData,
          tractionApiKey: encryptedApiKeyBase64,
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
    this.logger.info({ oidcIssuer, oidcClientId }, 'Creating or retrieving root tenant')
    try {
      const rootTenant = await this.getTenantByIssuerAndClientId(oidcIssuer, oidcClientId)
      if (rootTenant.tenantType !== TenantType.ROOT) {
        this.logger.error(
          { tenantId: rootTenant.id, tenantType: rootTenant.tenantType },
          'Configured root tenant is not actually a root tenant'
        )
        return Promise.reject(Error('Configured root tenant is not actually a root tenant'))
      }
      this.logger.info({ tenantId: rootTenant.id }, 'Root tenant already exists')
      return rootTenant // Return the existing tenant instead of undefined
    } catch (e) {
      if (e instanceof HttpError && e.httpCode === 404) {
        // Fixed type check syntax
        this.logger.info('Root tenant not found, creating new one')
        const newRootTenant: NewTenant = {
          id: oidcClientId,
          tenantType: TenantType.ROOT,
          oidcIssuer: oidcIssuer,
        }
        const createdTenant = await this.tenantRepository.create(newRootTenant)
        this.logger.info({ tenantId: createdTenant.id }, 'Successfully created root tenant')
        return createdTenant
      } else {
        this.logger.error({ error: e }, 'Failed to create root tenant')
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

  private async ensureDefaultIssuer(tenant: Tenant): Promise<void> {
    this.logger.debug({ tenantId: tenant.id }, 'Ensuring default issuer exists for tenant')
    
    // Check if tenant already has an issuer
    if (tenant.issuers && tenant.issuers.length > 0) {
      this.logger.debug({ tenantId: tenant.id, issuerCount: tenant.issuers.length }, 'Tenant already has issuers')
      return
    }

    try {
      // Create default issuer
      const newIssuer = await this.issuerRepository.create({
        name: `Default Issuer for ${tenant.id}`,
        type: IssuerType.ARIES,
        description: 'Default issuer created automatically',
        credentialDefinitions: [],
        credentialSchemas: [],
        tenantId: tenant.id,
      })

      this.logger.info(
        { tenantId: tenant.id, issuerId: newIssuer.id },
        'Successfully created default issuer for tenant'
      )

      // Also add the new issuer to the tenant object
      if (!tenant.issuers) {
        tenant.issuers = []
      }
      tenant.issuers.push(newIssuer)
    } catch (error) {
      this.logger.error({ error, tenantId: tenant.id }, 'Failed to create default issuer for tenant')
      throw error
    }
  }

  private async ensureDefaultRelyingParty(tenant: Tenant): Promise<void> {
    this.logger.debug({ tenantId: tenant.id }, 'Ensuring default relying party exists for tenant')
    
    // Check if tenant already has a relying party
    if (tenant.relyingParties && tenant.relyingParties.length > 0) {
      this.logger.debug(
        { tenantId: tenant.id, relyingPartyCount: tenant.relyingParties.length },
        'Tenant already has relying parties'
      )
      return
    }
    
    try {
      const RelyingParty = process.env.RELYING_PARTY_NAME
      // Create default relying party
      const newRelyingParty = await this.relyingPartyRepository.create({
        name: RelyingParty ? `${RelyingParty} for ${tenant.id}` : `Default Relying Party for ${tenant.id}`,
        type: RelyingPartyType.ARIES,
        description: 'Default relying party created automatically',
        credentialDefinitions: [],
        tenantId: tenant.id,
      })

      this.logger.info(
        { tenantId: tenant.id, relyingPartyId: newRelyingParty.id },
        'Successfully created default relying party for tenant'
      )

      // Also add the new relying party to the tenant object
      if (!tenant.relyingParties) {
        tenant.relyingParties = []
      }
      tenant.relyingParties.push(newRelyingParty)
    } catch (error) {
      this.logger.error({ error, tenantId: tenant.id }, 'Failed to create default relying party for tenant')
      throw error
    }
  }
}

export default TenantService
