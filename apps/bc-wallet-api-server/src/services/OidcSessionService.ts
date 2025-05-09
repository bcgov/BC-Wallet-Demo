import { Promise } from 'cypress/types/cy-bluebird'
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

  public async getCurrentUser(): Promise<User | null> {
    if (this._user === null) {
      try {
        this._user = await this.userService.getUserByName('test-user') // FIXME after authentication is fully working
      } catch (e) {
        this._user = await this.userService.createUser({
          userName: 'test-user',
        })
      }
    }
    return this._user
  }

  public async getCurrentTenant(): Promise<Tenant | null> {
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

  public async setCurrentUser(userName: string) {
    if (this._user === null) {
      try {
        this._user = await this.userService.getUserByName(userName) // FIXME after authentication is fully working
      } catch (e) {
        this._user = await this.userService.createUser({
          userName: 'test-user',
        })
      }
    }
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
