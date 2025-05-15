import { Service } from 'typedi'

import { Tenant, TenantType, User } from '../../types'
import { Claims } from '../../types/auth/claims'
import { OidcSession } from '../../types/auth/session'
import { Token } from '../../types/auth/token'
import type { ISessionService } from '../../types/services/session'

@Service()
export class MockSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null
  private urlTenantId: string | null = null
  private apiBaseUrl: string = 'http://localhost:3000'
  private bearerToken: Token | undefined
  private activeClaims: Claims | undefined

  public getCurrentUser(): User | null {
    console.log('[MockSession] getCurrentUser called')
    return (
      this.user ??
      ({
        id: 'user-id',
        userName: 'user-name',
        issuer: null,
        clientId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } satisfies User | null)
    )
  }

  public getCurrentTenant(): Tenant | null {
    console.log('[MockSession] getCurrentTenant called')
    return (
      this.tenant ??
      ({
        id: 'test-tenant',
        createdAt: new Date(),
        updatedAt: new Date(),
        tenantType: TenantType.ROOT,
        oidcIssuer: '',
        tractionTenantId: null,
        tractionApiUrl: null,
        tractionWalletId: null,
        tractionApiKey: null,
        nonceBase64: null,
        deletedAt: null,
      } satisfies Tenant)
    )
  }

  public getUrlTenantId(): string | null {
    // If we have a urlTenantId set explicitly, return it
    if (this.urlTenantId) {
      return this.urlTenantId
    }

    // Otherwise, fall back to the tenant's ID if we have a tenant
    return this.tenant?.id || null
  }

  public getBearerToken(): Token | undefined {
    return this.bearerToken
  }

  public getApiBaseUrl(): string | undefined {
    return this.apiBaseUrl
  }

  public getActiveClaims(): Claims | undefined {
    return this.activeClaims
  }

  public getCachedSessionByTokenHash(tokenHash: string): OidcSession | undefined {
    return undefined // Not needed for tests
  }

  // --- Test Control Methods ---

  /** Sets the user that will be returned by the next call to getCurrentUser */
  public setCurrentUser(user: User | null): void {
    this.user = user
  }

  /** Sets the tenant that will be returned by the next call to getCurrentTenant */
  public setCurrentTenant(tenant: Tenant | null): void {
    this.tenant = tenant

    // Also set the urlTenantId when setting the tenant to ensure getTenantId() works
    if (tenant) {
      this.urlTenantId = tenant.id
    }
  }

  /** Sets the URL tenant ID explicitly */
  public setUrlTenantId(tenantId: string | null): void {
    this.urlTenantId = tenantId
  }

  /** Sets the API base URL */
  public setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url
  }

  /** Sets the bearer token */
  public setBearerToken(token: Token | undefined): void {
    this.bearerToken = token
  }

  /** Sets the active claims */
  public setActiveClaims(claims: Claims | undefined): void {
    this.activeClaims = claims
  }

  /** Set request details similar to RequestContextMiddleware */
  public setRequestDetails(apiBaseUrl: string, tenantId: string | null, token?: Token): void {
    this.apiBaseUrl = apiBaseUrl
    this.urlTenantId = tenantId
    this.bearerToken = token
  }

  /** Resets the mock state */
  public clear(): void {
    this.user = null
    this.tenant = null
    this.urlTenantId = null
    this.apiBaseUrl = 'http://localhost:3000'
    this.bearerToken = undefined
    this.activeClaims = undefined
    console.log('[MockSession] Cleared')
  }
}
