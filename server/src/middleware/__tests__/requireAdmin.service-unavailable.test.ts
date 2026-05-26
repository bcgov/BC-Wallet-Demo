/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { NextFunction, Request, Response } from 'express'

import express from 'express'
import nock from 'nock'
import request from 'supertest'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { TEST_KEYCLOAK_URL, TEST_REALM } = vi.hoisted(() => ({
  TEST_KEYCLOAK_URL: 'http://keycloak-service-test',
  TEST_REALM: 'service-test-realm',
}))

// Mock fs before importing requireAdmin
vi.mock('fs', async (importOriginal) => {
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

import { ServiceUnavailableError } from '../requireAdmin'

const JWKS_PATH = `/realms/${TEST_REALM}/protocol/openid-connect/certs`

/**
 * Build an Express app that properly handles the new ServiceUnavailableError.
 * This mirrors the error handler in src/index.ts.
 */
function buildAppWithErrorHandler(requireAdminMiddleware: express.RequestHandler) {
  const app = express()
  app.use(requireAdminMiddleware)
  app.get('/protected', (_req, res) => res.json({ ok: true }))

  // 4-parameter signature is required for Express to recognize an error handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof ServiceUnavailableError) {
      res.status(503).json({ error: err.message })
      return
    }
    const status = (err as { status?: number }).status ?? 500
    res.status(status).json({ error: (err as Error).message })
  })

  return app
}

describe('requireAdmin middleware — ServiceUnavailableError handling', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('returns 503 when Keycloak JWKS endpoint is unreachable', async () => {
    // Simulate Keycloak being completely down
    nock(TEST_KEYCLOAK_URL).get(JWKS_PATH).replyWithError('connect ECONNREFUSED')

    const { requireAdmin: requireAdminMiddleware } = await import('../requireAdmin')
    const app = buildAppWithErrorHandler(requireAdminMiddleware)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(503)
    expect(res.body.error).toMatch(/Failed to fetch JWKS/)
  })

  it('returns 503 when Keycloak returns a 5xx error', async () => {
    nock(TEST_KEYCLOAK_URL).get(JWKS_PATH).reply(500, 'Internal Server Error')

    const { requireAdmin: requireAdminMiddleware } = await import('../requireAdmin')
    const app = buildAppWithErrorHandler(requireAdminMiddleware)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(503)
    expect(res.body.error).toMatch(/Failed to fetch JWKS/)
  })

  it('returns 503 when JWKS response is invalid JSON', async () => {
    nock(TEST_KEYCLOAK_URL).get(JWKS_PATH).reply(200, 'not valid json')

    const { requireAdmin: requireAdminMiddleware } = await import('../requireAdmin')
    const app = buildAppWithErrorHandler(requireAdminMiddleware)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(503)
    expect(res.body.error).toMatch(/Failed to fetch JWKS/)
  })

  it('returns 401 when token is missing even if JWKS fetch fails', async () => {
    nock(TEST_KEYCLOAK_URL).get(JWKS_PATH).replyWithError('JWKS unavailable')

    const { requireAdmin: requireAdminMiddleware } = await import('../requireAdmin')
    const app = buildAppWithErrorHandler(requireAdminMiddleware)

    // express-jwt checks for Authorization header first and fails fast with 401
    // before the secret function (getKey) is even called.
    const res = await request(app).get('/protected')

    expect(res.status).toBe(401)
  })

  it('ServiceUnavailableError is properly exported and instanceof check works', async () => {
    const err = new ServiceUnavailableError('Test error')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(ServiceUnavailableError)
    expect(err.name).toBe('ServiceUnavailableError')
    expect(err.message).toBe('Test error')
  })
})
