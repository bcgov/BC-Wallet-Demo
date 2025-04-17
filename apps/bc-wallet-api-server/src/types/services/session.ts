import type { Tenant, User } from '../schema'

export interface ISessionService {
  getCurrentUser(): Promise<User | null>

  getCurrentTenant(): Promise<Tenant | null>

  getBearerToken(): string | undefined

  getApiBaseUrl(): string | undefined
}

export interface ISessionServiceUpdater extends ISessionService {
  setRequestDetails(apiBaseUrl: string, token?: string): void
}
