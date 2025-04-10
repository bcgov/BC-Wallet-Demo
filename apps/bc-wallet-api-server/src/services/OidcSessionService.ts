import { Service } from 'typedi'

import type { Tenant, User } from '../types'
import type { ISessionService } from '../types/services/session'
import UserService from './UserService'

// TODO add logic to get current user & tenant matching the OIDC session

@Service()
export class OidcSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null
  private bearerToken: string = ''

  public constructor(private readonly userService: UserService) {
    console.log('userService', userService)
  }

  public async getCurrentUser(): Promise<User | null> {
    if (this.user === null) {
      try {
        this.user = await this.userService.getUserByName('test-user') // FIXME after authentication is fully working
      } catch (e) {
        this.user = await this.userService.createUser({
          userName: 'test-user',
        })
      }
    }
    return this.user
  }

  public async getCurrentTenant(): Promise<Tenant | null> {
    return this.tenant
  }

  public getBearerToken(): string {
    return this.bearerToken // TODO
  }

  public clear(): void {
    this.user = null
    this.tenant = null
  }
}
