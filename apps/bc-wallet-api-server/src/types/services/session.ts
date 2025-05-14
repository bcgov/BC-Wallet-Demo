import { Claims } from '../auth/claims'
import type { OidcSession } from '../auth/session'
import { Token } from '../auth/token'
import type { Tenant, User } from '../schema'

export interface ISessionService {
  getCurrentUser(): User | null

  getCurrentTenant(): Tenant | null

  getBearerToken(): Token | undefined

  getApiBaseUrl(): string | undefined

  getActiveClaims(): Claims | undefined

  getCachedSessionByTokenHash(tokenHash: string): OidcSession | undefined
}

export interface ISessionServiceUpdater extends ISessionService {
  setRequestDetails(apiBaseUrl: string, token?: Token): void

  setActiveClaims(claims: Claims): void

  setCurrentTenant(value: Tenant): void

  setCurrentUser(userName: string): Promise<void>

  cacheValidatedToken(tokenHash: string, token: Token, claims: Claims, ttlMs: number): void

  clear(): void
}
