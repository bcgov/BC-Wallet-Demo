import { Tenant, User } from '../schema'

export interface ISessionService {
  getCurrentUser(): Promise<User | null>

  getCurrentTenant(): Promise<Tenant | null>
}
