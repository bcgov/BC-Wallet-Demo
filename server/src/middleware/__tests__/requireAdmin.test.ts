import type { NextFunction, Request, Response } from 'express'

import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock fs.readFileSync so the middleware doesn't need a real keycloak.json on disk.
vi.mock('fs', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
    readFileSync: (path: string, encoding?: string) => {
      if (typeof path === 'string' && path.endsWith('keycloak.json')) {
        return JSON.stringify({ keycloakUrl: 'http://keycloak', keycloakRealm: 'test' })
      }
      return actual.readFileSync(path, encoding as BufferEncoding)
    },
  }
})

// expressjwt validates tokens; mock it so we control pass/fail without real JWTs.
vi.mock('express-jwt', () => ({
  expressjwt: () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers.authorization
      if (!auth) {
        res.status(401).json({ error: 'No token' })
        return
      }
      if (auth !== 'Bearer valid-token') {
        res.status(403).json({ error: 'Invalid token' })
        return
      }
      next()
    }
  },
}))

import { requireAdmin } from '../requireAdmin'

const app = express()
app.use(requireAdmin)
app.get('/protected', (_req, res) => res.json({ ok: true }))

describe('requireAdmin middleware', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
  })

  it('returns 403 when the token is invalid', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer bad-token')
    expect(res.status).toBe(403)
  })

  it('calls next and returns 200 when the token is valid', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer valid-token')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
