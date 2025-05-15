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
    return null
  }

  public getBearerToken(): Token | undefined {
    return undefined
  }

  // --- Test Control Methods ---

  /** Sets the user that will be returned by the next call to getCurrentUser */
  public setCurrentUser(user: User | null): void {
    this.user = user
  }

  /** Sets the tenant that will be returned by the next call to getCurrentTenant */
  public setCurrentTenant(tenant: Tenant | null): void {
    this.tenant = tenant
  }

  public getApiBaseUrl(): string | undefined {
    return undefined
  }

  public getActiveClaims(): Claims | undefined {
    throw new Error('Method not implemented.')
  }

  /** Resets the mock state */
  public clear(): void {
    this.user = null
    this.tenant = null
    console.log('[MockSession] Cleared')
  }

  public getCachedSessionByTokenHash(tokenHash: string): OidcSession | undefined {
    throw new Error('Method not implemented.')
  }
}
