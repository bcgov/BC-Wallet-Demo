import { AsyncLocalStorage } from 'async_hooks'
import { LRUCache } from 'lru-cache'
import { Service } from 'typedi'

import type { Tenant, User } from '../types'
import { Claims } from '../types/auth/claims'
import type { OidcSession } from '../types/auth/session'
import { Token } from '../types/auth/token'
import type { ISessionService, ISessionServiceUpdater } from '../types/services/session'
import UserService from './UserService'

const sessionCache = new LRUCache<string, OidcSession>({
  max: 65535,
  ttl: 30 * 60 * 1000, // We toss sessions after 30 minutes to not build a too large map. After it expires, we just do new DB lookups
  allowStale: false,
})

// per-request store for current token hash
export const tokenHashStore = new AsyncLocalStorage<string>()

@Service()
export class OidcSessionService implements ISessionService, ISessionServiceUpdater {
  public constructor(private readonly userService: UserService) {}

  public getCurrentUser(): User | null {
    return this.getSession().user
  }

  public getCurrentTenant(): Tenant | null {
    return this.getSession().tenant
  }

  public getBearerToken(): Token | undefined {
    return this.getSession().bearerToken
  }

  public getApiBaseUrl(): string | undefined {
    return this.getSession().apiBaseUrl
  }

  public getActiveClaims(): Claims | undefined {
    return this.getSession().activeClaims
  }

  public setRequestDetails(apiBaseUrl: string, token?: Token): void {
    if (!token) {
      return
    }
    const hash = token.getSignatureHash()
    tokenHashStore.enterWith(hash)
    let session = sessionCache.get(hash)
    if (!session) {
      session = { user: null, tenant: null }
    }
    session.apiBaseUrl = apiBaseUrl
    session.bearerToken = token
    sessionCache.set(hash, session)
  }

  public setActiveClaims(claims: Claims): void {
    const hash = this.getCurrentHash()
    if (!hash) {
      console.warn('Attempted to set active claims without a token in context.')
      return
    }
    const session = this.getSession()
    session.activeClaims = claims
    sessionCache.set(hash, session)
  }

  public async setCurrentUser(userName: string): Promise<void> {
    const hash = this.getCurrentHash()
    const session = this.getSession()
    if (!session.user) {
      if (!session.tenant) {
        return Promise.reject(new Error('Tenant is not set'))
      }
      try {
        session.user = await this.userService.getUserByNameAndTenantId(userName, session.tenant.id)
      } catch {
        session.user = await this.userService.createUser({ userName: 'test-user' })
      }
      sessionCache.set(hash, session)
    }
  }

  public setCurrentTenant(value: Tenant): void {
    const hash = this.getCurrentHash()
    const session = this.getSession()
    session.tenant = value
    sessionCache.set(hash, session)
  }

  public clear(): void {
    const hash = this.getCurrentHash()
    sessionCache.delete(hash)
    tokenHashStore.disable()
  }

  private getCurrentHash(): string {
    const hash = tokenHashStore.getStore()
    if (!hash) {
      throw new Error('No token signature hash in context')
    }
    return hash
  }

  private getSession(): OidcSession {
    const hash = tokenHashStore.getStore()
    if (!hash) {
      return { user: null, tenant: null }
    }
    let session = sessionCache.get(hash)
    if (!session) {
      session = { user: null, tenant: null }
      sessionCache.set(hash, session)
    }
    return session
  }
}
