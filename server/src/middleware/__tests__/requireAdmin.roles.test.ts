import type { NextFunction, Request, Response } from 'express'

import express from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock fs.readFileSync for keycloak.json
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

// Mock expressjwt to attach req.auth without real JWT validation
vi.mock('express-jwt', () => ({
  expressjwt: () => {
    return (req: Request, res: Response, next: NextFunction) => {
      const auth = req.headers['x-test-auth']
      if (!auth) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      try {
        req.auth = JSON.parse(String(auth))
        next()
      } catch {
        res.status(401).json({ error: 'Invalid auth header' })
      }
    }
  },
}))

import { requireAdmin, requireRole, userHasRole } from '../requireAdmin'

describe('Role-based authentication middleware', () => {
  describe('requireRole middleware', () => {
    const app = express()
    app.use(requireAdmin)

    // Test endpoint that requires 'admin' role
    app.get('/admin-only', requireRole(['admin']), (_req, res) => {
      res.json({ ok: true })
    })

    // Test endpoint that requires 'admin' or 'creator' role
    app.get('/admin-or-creator', requireRole(['admin', 'creator']), (_req, res) => {
      res.json({ ok: true })
    })

    it('returns 401 when no auth token is provided', async () => {
      const res = await request(app).get('/admin-only')
      expect(res.status).toBe(401)
    })

    it('returns 403 when user does not have the required role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['user'] } }
      const res = await request(app).get('/admin-only').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(403)
      expect(res.body.error).toContain('insufficient role')
    })

    it('allows access when user has the required role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['admin', 'user'] } }
      const res = await request(app).get('/admin-only').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ ok: true })
    })

    it('allows access when user has one of multiple required roles', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['creator', 'user'] } }
      const res = await request(app).get('/admin-or-creator').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(200)
      expect(res.body).toEqual({ ok: true })
    })

    it('returns 403 when user lacks all required roles', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['user'] } }
      const res = await request(app).get('/admin-or-creator').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(403)
    })

    it('handles missing realm_access gracefully', async () => {
      const auth = { sub: 'user1' }
      const res = await request(app).get('/admin-only').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(403)
    })
  })

  describe('userHasRole utility function', () => {
    it('returns true when user has the role', () => {
      const auth = { sub: 'user1', realm_access: { roles: ['admin', 'user'] } }
      expect(userHasRole(auth, 'admin')).toBe(true)
    })

    it('returns false when user does not have the role', () => {
      const auth = { sub: 'user1', realm_access: { roles: ['user'] } }
      expect(userHasRole(auth, 'admin')).toBe(false)
    })

    it('returns false when auth is undefined', () => {
      expect(userHasRole(undefined, 'admin')).toBe(false)
    })

    it('returns false when realm_access is missing', () => {
      const auth = { sub: 'user1' }
      expect(userHasRole(auth, 'admin')).toBe(false)
    })

    it('returns false when roles array is empty', () => {
      const auth = { sub: 'user1', realm_access: { roles: [] } }
      expect(userHasRole(auth, 'admin')).toBe(false)
    })
  })
})
