import { Service } from 'typedi'
import { ISessionService } from '../types/services/session'
import { Tenant, User } from '../types'

// TODO add logic to get current user & tenant matching the OIDC session
@Service()
export class OidcSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null

  public async getCurrentUser(): Promise<User | null> {
    return Promise.resolve(this.user)
  }

  public async getCurrentTenant(): Promise<Tenant | null> {
    return Promise.resolve(this.tenant)
  }

  clear(): void {
    this.user = null
    this.tenant = null
  }
}
