import { AdapterClientApi } from 'bc-wallet-adapter-client-api'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import Container, { Service } from 'typedi'

import { createMockDatabaseService } from '../../database/repositories/__tests__/dbTestData'
import DatabaseService from '../../services/DatabaseService'
import type { Tenant, User } from '../../types'
import type { ISessionService } from '../../types/services/session'

@Service()
export class MockSessionService implements ISessionService {
  private user: User | null = null
  private tenant: Tenant | null = null

  public async getCurrentUser(): Promise<User | null> {
    console.log('[MockSession] getCurrentUser called')
    return Promise.resolve(this.user)
  }

  public async getCurrentTenant(): Promise<Tenant | null> {
    console.log('[MockSession] getCurrentTenant called')
    return Promise.resolve(this.tenant)
  }

  public getBearerToken(): string {
    return ''
  }

  // --- Test Control Methods ---

  /** Sets the user that will be returned by the next call to getCurrentUser */
  public setCurrentUser(user: User | null): void {
    this.user = user
  }

  /** Sets the tenant that will be returned by the next call to getCurrentTenant */
  public setCurrentTenant(tenant: Tenant | null): void {
    this.tenant = tenant
  }

  public getApiBaseUrl(): string | undefined {
    return undefined
  }

  /** Resets the mock state */
  public clear(): void {
    this.user = null
    this.tenant = null
    console.log('[MockSession] Cleared')
  }
}

export async function registerMockServicesByInterface(database: NodePgDatabase) {
  const oidcSessionService = Container.get(MockSessionService)
  Container.set('ISessionService', oidcSessionService)
  const adapterClientApi = Container.get(AdapterClientApi)
  Container.set('IAdapterClientApi', adapterClientApi)
  const mockDatabaseService = await createMockDatabaseService(database)
  Container.set(DatabaseService, mockDatabaseService)
}
