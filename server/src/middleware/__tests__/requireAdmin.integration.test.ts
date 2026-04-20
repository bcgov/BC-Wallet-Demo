import type { Request, Response } from 'express'

import crypto from 'crypto'
import express from 'express'
import jwt from 'jsonwebtoken'
import nock from 'nock'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// vi.mock factories are hoisted above variable declarations, so constants used
// inside them must be defined with vi.hoisted to be available at hoist time.
const { TEST_KEYCLOAK_URL, TEST_REALM } = vi.hoisted(() => ({
  TEST_KEYCLOAK_URL: 'http://keycloak-integration-test',
  TEST_REALM: 'integration-realm',
}))

// Mock fs so the middleware doesn't need a real keycloak.json — must be declared
// before requireAdmin is imported since the config is read at module load time.
vi.mock('fs', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    readFileSync: (path: string, encoding?: string) => {
      if (typeof path === 'string' && path.endsWith('keycloak.json')) {
        return JSON.stringify({ keycloakUrl: TEST_KEYCLOAK_URL, keycloakRealm: TEST_REALM })
      }
      return actual.readFileSync(path, encoding as BufferEncoding)
    },
  }
})

import { requireAdmin } from '../requireAdmin'

// Generate a real RSA keypair once for the entire test suite.
const TEST_KID = 'integration-test-key-1'
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
const testJwk = {
  ...publicKey.export({ format: 'jwk' }),
  kid: TEST_KID,
  use: 'sig',
  alg: 'RS256',
}

const ISSUER = `${TEST_KEYCLOAK_URL}/realms/${TEST_REALM}`
const JWKS_PATH = `/realms/${TEST_REALM}/protocol/openid-connect/certs`

// Minimal Express app that mirrors how requireAdmin is mounted in production.
const app = express()
app.use(requireAdmin)
app.get('/protected', (_req, res) => res.json({ ok: true }))

// express-jwt calls next(err) on failure; map the error's status to the HTTP response.
app.use((err: unknown, _req: Request, res: Response) => {
  const status = (err as { status?: number }).status ?? 500
  res.status(status).json({ error: (err as Error).message })
})

/** Sign a test JWT with the test private key. */
function signToken(
  overrides: Partial<{
    issuer: string
    expiresIn: number
    kid: string
    privateKey: crypto.KeyObject
  }> = {},
) {
  return jwt.sign({ sub: 'test-user' }, overrides.privateKey ?? privateKey, {
    algorithm: 'RS256',
    keyid: overrides.kid ?? TEST_KID,
    expiresIn: overrides.expiresIn ?? 300,
    issuer: overrides.issuer ?? ISSUER,
  })
}

describe('requireAdmin middleware (integration — real JWT verification)', () => {
  beforeAll(() => {
    // Intercept JWKS fetches for the duration of this suite.
    nock(TEST_KEYCLOAK_URL)
      .get(JWKS_PATH)
      .reply(200, { keys: [testJwk] })
      .persist()
  })

  afterAll(() => {
    nock.cleanAll()
  })

  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
  })

  it('returns 401 when the JWT is signed with a different private key', async () => {
    // kid matches so key lookup succeeds, but the signature won't verify.
    const { privateKey: otherPrivateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 })
    const badToken = signToken({ privateKey: otherPrivateKey })
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${badToken}`)
    expect(res.status).toBe(401)
  })

  it('returns 401 when the JWT is expired', async () => {
    const expiredToken = signToken({ expiresIn: -60 })
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expiredToken}`)
    expect(res.status).toBe(401)
  })

  it('returns 401 when the JWT issuer does not match', async () => {
    const wrongIssuerToken = signToken({ issuer: 'http://wrong-issuer/realms/other' })
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${wrongIssuerToken}`)
    expect(res.status).toBe(401)
  })

  it('calls next and returns 200 when a valid JWT is provided', async () => {
    const token = signToken()
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
