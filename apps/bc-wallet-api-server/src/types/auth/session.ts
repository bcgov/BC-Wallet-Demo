import { Tenant, User } from '../schema'
import { Claims } from './claims'
import { Token } from './token'

export interface OidcSession {
  user: User | null
  tenant: Tenant | null
  bearerToken?: Token
  apiBaseUrl?: string
  activeClaims?: Claims
}
