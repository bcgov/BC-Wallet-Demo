import { Claims } from '../auth/claims'
import type { Tenant, User } from '../schema'

export interface ISessionService {
  getCurrentUser(): Promise<User | null>

  getCurrentTenant(): Promise<Tenant | null>

  getBearerToken(): string | undefined

  getApiBaseUrl(): string | undefined

  getActiveClaims(): Claims | undefined
}

export interface ISessionServiceUpdater extends ISessionService {
  setRequestDetails(apiBaseUrl: string, token?: string): void

  setActiveClaims(claims: Claims): void
}
