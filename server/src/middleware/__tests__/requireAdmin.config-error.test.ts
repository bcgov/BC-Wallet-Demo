/* eslint-disable @typescript-eslint/consistent-type-imports */
import type { NextFunction, Request, Response } from 'express'

import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Logger is always silenced; vi.mock is hoisted so it applies to every fresh import below.
vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

/** Minimal Express app that surfaces errors from requireAdmin as JSON. */
function buildApp(requireAdmin: express.RequestHandler) {
  const app = express()
  app.use(requireAdmin)
  app.get('/protected', (_req, res) => res.json({ ok: true }))
  // 4-parameter signature is required for Express to recognise an error handler.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number }).status ?? 500
    res.status(status).json({ error: (err as Error).message })
  })
  return app
}

describe('requireAdmin — config loading failures', () => {
  beforeEach(() => {
    // Clear the module instance cache before each test so the fresh vi.doMock
    // factories are picked up when requireAdmin is dynamically imported.
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fails fast with the original error when keycloak.json is missing', async () => {
    const axiosGet = vi.fn()
    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>()
      return {
        ...actual,
        readFileSync: (path: string, encoding?: string) => {
          if (typeof path === 'string' && path.endsWith('keycloak.json')) {
            throw Object.assign(new Error("ENOENT: no such file or directory, open '/app/config/keycloak.json'"), {
              code: 'ENOENT',
            })
          }
          return actual.readFileSync(path, encoding as BufferEncoding)
        },
      }
    })
    vi.doMock('axios', () => ({ default: { get: axiosGet } }))

    const { requireAdmin } = await import('../requireAdmin')
    const app = buildApp(requireAdmin)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/ENOENT/)
    expect(axiosGet).not.toHaveBeenCalled()
  })

  it('fails fast with a clear message when keycloakUrl is an empty string', async () => {
    const axiosGet = vi.fn()
    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>()
      return {
        ...actual,
        readFileSync: (path: string, encoding?: string) => {
          if (typeof path === 'string' && path.endsWith('keycloak.json')) {
            return JSON.stringify({ keycloakUrl: '', keycloakRealm: 'some-realm' })
          }
          return actual.readFileSync(path, encoding as BufferEncoding)
        },
      }
    })
    vi.doMock('axios', () => ({ default: { get: axiosGet } }))

    const { requireAdmin } = await import('../requireAdmin')
    const app = buildApp(requireAdmin)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/keycloakUrl and keycloakRealm must be non-empty/)
    expect(axiosGet).not.toHaveBeenCalled()
  })

  it('fails fast with a clear message when keycloakRealm is an empty string', async () => {
    const axiosGet = vi.fn()
    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>()
      return {
        ...actual,
        readFileSync: (path: string, encoding?: string) => {
          if (typeof path === 'string' && path.endsWith('keycloak.json')) {
            return JSON.stringify({ keycloakUrl: 'http://keycloak', keycloakRealm: '' })
          }
          return actual.readFileSync(path, encoding as BufferEncoding)
        },
      }
    })
    vi.doMock('axios', () => ({ default: { get: axiosGet } }))

    const { requireAdmin } = await import('../requireAdmin')
    const app = buildApp(requireAdmin)

    const res = await request(app).get('/protected').set('Authorization', 'Bearer any-token')

    expect(res.status).toBe(500)
    expect(res.body.error).toMatch(/keycloakUrl and keycloakRealm must be non-empty/)
    expect(axiosGet).not.toHaveBeenCalled()
  })

  it('still returns 401 for unauthenticated requests when config is broken', async () => {
    vi.doMock('fs', async (importOriginal) => {
      const actual = await importOriginal<typeof import('fs')>()
      return {
        ...actual,
        readFileSync: (path: string, encoding?: string) => {
          if (typeof path === 'string' && path.endsWith('keycloak.json')) {
            throw new Error('ENOENT')
          }
          return actual.readFileSync(path, encoding as BufferEncoding)
        },
      }
    })
    vi.doMock('axios', () => ({ default: { get: vi.fn() } }))

    const { requireAdmin } = await import('../requireAdmin')
    const app = buildApp(requireAdmin)

    // No Authorization header — express-jwt short-circuits before calling the secret.
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
  })
})
