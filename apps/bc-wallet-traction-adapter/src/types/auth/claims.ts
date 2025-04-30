export interface Claims {
  // Standard JWT claims
  exp: number
  iat: number
  auth_time: number
  jti: string
  iss: string
  aud: string[] | string
  sub: string
  typ: string

  // OpenID and auth specific
  azp: string
  session_state: string
  acr: string
  sid: string
  scope: string

  // Custom claims
  'allowed-origins'?: string[]
  realm_access?: {
    roles: string[]
  }
  resource_access?: {
    [key: string]: {
      roles: string[]
    }
  }

  // User info
  email_verified?: boolean
  name?: string
  preferred_username?: string
  given_name?: string
  email?: string

  // Additional properties
  [key: string]: any
}
