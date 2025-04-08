import { ISessionService } from '../../types/services/session'
import { Tenant, User } from '../../types'
import { Service } from 'typedi'

@Service()
export class MockSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null

  public async getCurrentUser(): Promise<User | null> {
    console.log('[MockSession] getCurrentUser called')
    return Promise.resolve(this.user)
  }

  public async getCurrentTenant(): Promise<Tenant | null> {
    console.log('[MockSession] getCurrentTenant called')
    return Promise.resolve(this.tenant)
  }

  // --- Test Control Methods ---

  /** Sets the user that will be returned by the next call to getCurrentUser */
  setCurrentUser(user: User | null): void {
    this.user = user
  }

  /** Sets the tenant that will be returned by the next call to getCurrentTenant */
  setCurrentTenant(tenant: Tenant | null): void {
    this.tenant = tenant
  }

  /** Resets the mock state */
  clear(): void {
    this.user = null
    this.tenant = null
    console.log('[MockSession] Cleared')
  }
}
