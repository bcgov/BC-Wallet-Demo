import { Service } from 'typedi'

import type { Tenant, User } from '../types'
import { Claims } from '../types/auth/claims'
import { ISessionService, ISessionServiceUpdater } from '../types/services/session'
import UserService from './UserService'

// TODO add logic to get current user & tenant matching the OIDC session

@Service()
export class OidcSessionService implements ISessionService, ISessionServiceUpdater {
  private _user: User | null = null
  private _tenant: Tenant | null = null
  private bearerToken?: string
  private apiBaseUrl?: string
  private activeClaims?: Claims

  public constructor(private readonly userService: UserService) {}

  public getCurrentUser(): User | null {
    return this._user
  }

  public getCurrentTenant(): Tenant | null {
    return this._tenant
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

  public async setCurrentUser(userName: string): Promise<void> {
    if (this._user === null) {
      if (this._tenant === null) {
        throw new Error('Tenant is not set')
      }
      try {
        this._user = await this.userService.getUserByNameAndTenantId(userName, this._tenant.id)
      } catch (e) {
        this._user = await this.userService.createUser({
          userName: 'test-user',
        })
      }
    }
    return Promise.resolve()
  }

  public setCurrentTenant(value: Tenant) {
    this._tenant = value
  }

  public clear(): void {
    this._user = null
    this._tenant = null
    this.apiBaseUrl = undefined
    this.bearerToken = undefined
  }
}
