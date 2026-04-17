import type { JsonWebKeyInput } from 'crypto'
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
let keycloakConfig: KeycloakConfig

try {
  keycloakConfig = JSON.parse(readFileSync(configPath, 'utf8')) as KeycloakConfig
} catch (err) {
  logger.error({ err, configPath }, 'Failed to load config/keycloak.json — admin JWT verification will fail')
  keycloakConfig = { keycloakUrl: '', keycloakRealm: '' }
}

const { keycloakUrl, keycloakRealm } = keycloakConfig
const jwksUri = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`
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

async function getJwks(): Promise<Jwk[]> {
  if (Date.now() - keysCachedAt < CACHE_TTL_MS) return cachedKeys
  const { data } = await axios.get<JwksResponse>(jwksUri)
  cachedKeys = data.keys
  keysCachedAt = Date.now()
  return cachedKeys
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
 * Responds with 401 when the token is missing and 403 when invalid/expired.
 */
export const requireAdmin = expressjwt({
  secret: getKey,
  algorithms: ['RS256'],
  issuer,
})
