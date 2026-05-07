import type { KeycloakJWT } from '../types'
import type { JsonWebKeyInput } from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import type { GetVerificationKey } from 'express-jwt'

import axios from 'axios'
import { createPublicKey } from 'crypto'
import { expressjwt } from 'express-jwt'
import { readFileSync } from 'fs'
import { resolve } from 'path'

import logger from '../utils/logger'

interface KeycloakConfig {
  keycloakUrl: string
  keycloakRealm: string
}

// Read at startup. Mount a different config/keycloak.json per environment.
const configPath = resolve(process.cwd(), 'config/keycloak.json')
let keycloakConfig: KeycloakConfig | null = null
let keycloakConfigError: Error | null = null

try {
  keycloakConfig = JSON.parse(readFileSync(configPath, 'utf8')) as KeycloakConfig
  if (!keycloakConfig.keycloakUrl || !keycloakConfig.keycloakRealm) {
    throw new Error('keycloakUrl and keycloakRealm must be non-empty strings in config/keycloak.json')
  }
} catch (err) {
  keycloakConfigError = err instanceof Error ? err : new Error(String(err))
  logger.error({ err, configPath }, 'Failed to load config/keycloak.json — admin JWT verification will fail')
  keycloakConfig = { keycloakUrl: '', keycloakRealm: '' }
}

const { keycloakUrl, keycloakRealm } = keycloakConfig
// KEYCLOAK_INTERNAL_URL lets the server reach Keycloak via its Docker service name
// (e.g. http://keycloak:8080) while the issuer still matches the external URL that
// the browser used during login (http://localhost:8080).
const internalKeycloakUrl = process.env.KEYCLOAK_INTERNAL_URL ?? keycloakUrl
const jwksUri = `${internalKeycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`
const issuer = `${keycloakUrl}/realms/${keycloakRealm}`

interface Jwk {
  kid: string
  kty: string
  [key: string]: unknown
}

interface JwksResponse {
  keys: Jwk[]
}

// JWKS cache — refreshed at most once per minute.
let cachedKeys: Jwk[] = []
let keysCachedAt = 0
const CACHE_TTL_MS = 60_000

// Failure cache — after a fetch error, fail fast for this window before retrying.
let lastFetchError: Error | null = null
let fetchFailedAt = 0
const FAILURE_TTL_MS = 10_000

const JWKS_TIMEOUT_MS = 5_000

async function getJwks(): Promise<Jwk[]> {
  if (keycloakConfigError) throw keycloakConfigError

  if (Date.now() - keysCachedAt < CACHE_TTL_MS) return cachedKeys

  if (lastFetchError && Date.now() - fetchFailedAt < FAILURE_TTL_MS) {
    throw lastFetchError
  }

  try {
    const { data } = await axios.get<JwksResponse>(jwksUri, { timeout: JWKS_TIMEOUT_MS })
    cachedKeys = data.keys
    keysCachedAt = Date.now()
    lastFetchError = null
    return cachedKeys
  } catch (err) {
    lastFetchError = err instanceof Error ? err : new Error(String(err))
    fetchFailedAt = Date.now()
    throw lastFetchError
  }
}

const getKey: GetVerificationKey = async (_req, token) => {
  const keys = await getJwks()
  const jwk = keys.find((k) => k.kid === token?.header.kid)
  if (!jwk) throw new Error(`No JWKS key found for kid: ${String(token?.header.kid)}`)
  return createPublicKey({ key: jwk as JsonWebKeyInput['key'], format: 'jwk' })
}

/**
 * Express middleware that verifies the Keycloak-issued JWT in the
 * Authorization header. Apply to any route that requires admin authentication.
 *
 * By default, `express-jwt` reports missing, invalid, and expired tokens as 401
 * Unauthorized errors unless application-level error handling remaps them.
 */
export const requireAdmin = expressjwt({
  secret: getKey,
  algorithms: ['RS256'],
  issuer,
})

/**
 * Middleware factory that requires the user to have one or more specific roles.
 *
 * @param allowedRoles - Array of role names the user must have (realm-level roles from Keycloak)
 * @returns Express middleware that checks for required roles
 *
 * Usage:
 *   router.post('/', requireAdmin, requireRole(['admin', 'creator']), (req, res) => { ... })
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.auth as KeycloakJWT | undefined

    if (!auth) {
      logger.warn('requireRole: no auth found (requireAdmin should have been applied first)')
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const userRoles = auth.realm_access?.roles ?? []
    const hasRole = allowedRoles.some((role) => userRoles.includes(role))

    if (!hasRole) {
      logger.warn(
        { username: auth.preferred_username, required: allowedRoles, has: userRoles },
        'User does not have required role',
      )
      return res.status(403).json({ error: 'Forbidden: insufficient role' })
    }

    next()
  }
}

/**
 * Utility function to check if a user has a specific realm role.
 * Can be used inside route handlers instead of as middleware.
 *
 * @param auth - The KeycloakJWT from req.auth
 * @param role - The role name to check for
 * @returns boolean indicating if the user has the role
 */
export function userHasRole(auth: KeycloakJWT | undefined, role: string): boolean {
  if (!auth) return false
  return (auth.realm_access?.roles ?? []).includes(role)
}
