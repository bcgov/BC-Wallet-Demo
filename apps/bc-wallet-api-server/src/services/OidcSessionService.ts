import { Service } from 'typedi'

import type { Tenant, User } from '../types'
import { Claims } from '../types/auth/claims'
import { ISessionService, ISessionServiceUpdater } from '../types/services/session'
import UserService from './UserService'

// TODO add logic to get current user & tenant matching the OIDC session

@Service()
export class OidcSessionService implements ISessionService, ISessionServiceUpdater {
  private user: User | null = null
  private tenant: Tenant | null = null
  private bearerToken?: string
  private apiBaseUrl?: string
  private activeClaims?: Claims

  public constructor(private readonly userService: UserService) {}

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

  public getBearerToken(): string | undefined {
    return this.bearerToken
  }

  public getApiBaseUrl(): string | undefined {
    return this.apiBaseUrl
  }

  public setRequestDetails(apiBaseUrl: string, token?: string): void {
    this.apiBaseUrl = apiBaseUrl
    this.bearerToken = token
  }

  public setActiveClaims(claims: Claims): void {
    this.activeClaims = claims
  }

  public getActiveClaims(): Claims | undefined {
    return this.activeClaims
  }

  public clear(): void {
    this.user = null
    this.tenant = null
    this.apiBaseUrl = undefined
    this.bearerToken = undefined
  }
}
