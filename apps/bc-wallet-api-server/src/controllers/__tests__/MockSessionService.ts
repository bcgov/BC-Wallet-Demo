import { Service } from 'typedi'

import type { Tenant, User } from '../../types'
import { Claims } from '../../types/auth/claims'
import { Token } from '../../types/auth/token'
import type { ISessionService } from '../../types/services/session'

@Service()
export class MockSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null

  public getCurrentUser(): User | null {
    console.log('[MockSession] getCurrentUser called')
    return this.user
  }

  public getCurrentTenant(): Tenant | null {
    console.log('[MockSession] getCurrentTenant called')
    return this.tenant
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
}
