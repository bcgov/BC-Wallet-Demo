/**
 * Extended JWT payload from Keycloak with role information.
 * The auth object attached by express-jwt will have this shape.
 */
export interface KeycloakJWT {
  sub: string
  preferred_username?: string
  name?: string
  email?: string
  // Realm-level roles
  realm_access?: {
    roles: string[]
  }
  // Client-specific roles (adjust clientId as needed)
  resource_access?: {
    [clientId: string]: {
      roles: string[]
    }
  }
  [key: string]: unknown
}

declare global {
  namespace Express {
    interface Request {
      /**
       * The Keycloak JWT payload attached by the requireAdmin middleware.
       * Only available on authenticated routes.
       */
      auth?: KeycloakJWT
    }
  }
}
