import { Claims } from '../auth/claims'
import type { Tenant, User } from '../schema'

export interface ISessionService {
  getCurrentUser(): User | null

  getCurrentTenant(): Tenant | null

  getBearerToken(): string | undefined

  getApiBaseUrl(): string | undefined

  getActiveClaims(): Claims | undefined
}

export interface ISessionServiceUpdater extends ISessionService {
  setRequestDetails(apiBaseUrl: string, token?: string): void

  setActiveClaims(claims: Claims): void

  setCurrentTenant(value: Tenant): void

  setCurrentUser(userName: string): Promise<void>
}
