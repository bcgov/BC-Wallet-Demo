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
  ttl: 5 * 60 * 1000, // We toss sessions after 5 minutes by default. This will be overridden by validated tokens.
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

  public getUrlTenantId(): string | null {
    return this.getSession().urlTenantId
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

  public setRequestDetails(apiBaseUrl: string, urlTenantId: string | null, token?: Token): void {
    if (!token) {
      return
    }
    const hash = token.getSignatureHash()
    tokenHashStore.enterWith(hash)
    let session = sessionCache.get(hash)
    if (!session) {
      session = { user: null, urlTenantId: urlTenantId, tenant: null }
      // Add to cache with default TTL. If token is validated later, TTL will be updated.
      sessionCache.set(hash, session)
    }
    session.apiBaseUrl = apiBaseUrl
    session.urlTenantId = urlTenantId
    session.bearerToken = token // Store the raw token, may not be validated yet
  }

  public setActiveClaims(claims: Claims): void {
    const hash = this.getCurrentHash()
    if (!hash) {
      console.warn('Attempted to set active claims without a token in context.')
      return
    }
    const session = this.getSession()
    session.activeClaims = claims
  }

  public async setCurrentUser(userName: string): Promise<void> {
    const session = this.getSession()
    if (!session.user) {
      if (!session.tenant) {
        return Promise.reject(new Error('Tenant is not set'))
      }
      try {
        session.user = await this.userService.getUserByNameAndTenantId(userName, session.tenant.id)
      } catch {
        session.user = await this.userService.createUser({ userName })
      }
    }
  }

  public setCurrentTenant(value: Tenant): void {
    const session = this.getSession()
    session.tenant = value
  }

  public clear(): void {
    const hash = this.getCurrentHash()
    sessionCache.delete(hash)
    tokenHashStore.disable() // Clears the store for the current async execution path
  }

  public getCachedSessionByTokenHash(tokenHash: string): OidcSession | undefined {
    return sessionCache.get(tokenHash)
  }

  public cacheValidatedToken(tokenHash: string, token: Token, claims: Claims, ttlMs: number): void {
    if (ttlMs <= 0) {
      // If TTL is not positive, don't cache it
      let existingSession = sessionCache.get(tokenHash)
      if (existingSession) {
        existingSession.bearerToken = token
        existingSession.activeClaims = claims
      }
      return
    }

    let session = sessionCache.get(tokenHash)
    if (!session) {
      session = { user: null, urlTenantId: null, tenant: null }
    }
    session.bearerToken = token
    session.activeClaims = claims
    sessionCache.set(tokenHash, session, { ttl: ttlMs })
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
      return { user: null, urlTenantId: null, tenant: null }
    }
    let session = sessionCache.get(hash)
    if (!session) {
      session = { user: null, urlTenantId: null, tenant: null }
      sessionCache.set(hash, session)
    }
    return session
  }
}
