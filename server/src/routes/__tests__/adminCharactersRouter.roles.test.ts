import type { NextFunction, Request, Response } from 'express'

import express, { json } from 'express'
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

// Mock expressjwt to simulate authenticated requests
vi.mock('../../middleware/requireAdmin', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('../../middleware/requireAdmin')>()
  return {
    ...actual,
    // Override requireAdmin to just parse x-test-auth header
    requireAdmin: (_req: Request, _res: Response, next: NextFunction) => {
      next()
    },
  }
})

import adminCharactersRouter from '../adminCharactersRouter'

/**
 * Helper to create an Express app with requireAdmin and requireRole middleware applied.
 * This tests the router with proper role-based access control.
 */
function createAppWithRoles() {
  const app = express()
  app.use(json())

  // Mock requireAdmin to attach req.auth from test header
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const auth = req.headers['x-test-auth']
    if (auth) {
      try {
        req.auth = JSON.parse(String(auth))
      } catch {
        // Ignore parse errors
      }
    }
    next()
  })

  app.use('/admin/characters', adminCharactersRouter)
  return app
}

describe('adminCharactersRouter with role-based access control', () => {
  describe('GET /admin/characters (read-only endpoint)', () => {
    const app = createAppWithRoles()

    it('returns 200 with a message when authenticated with viewer role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['viewer'] } }
      const res = await request(app).get('/admin/characters').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })

    it('returns 403 when user does not have required read role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['user'] } }
      const res = await request(app).get('/admin/characters').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(403)
    })
  })

  describe('POST /admin/characters (requires admin or creator role)', () => {
    const app = createAppWithRoles()

    it('returns 403 when user does not have admin or creator role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['user'] } }
      const res = await request(app).post('/admin/characters').set('x-test-auth', JSON.stringify(auth)).send({
        name: 'New Character',
      })
      expect(res.status).toBe(403)
      expect(res.body.error).toContain('insufficient role')
    })

    it('returns 201 when user has admin role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['admin'] } }
      const res = await request(app).post('/admin/characters').set('x-test-auth', JSON.stringify(auth)).send({
        name: 'New Character',
      })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('message')
    })

    it('returns 201 when user has admin or creator role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['creator'] } }
      const res = await request(app).post('/admin/characters').set('x-test-auth', JSON.stringify(auth)).send({
        name: 'New Character',
      })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('message')
    })

    it('returns 401 when no auth token provided', async () => {
      const res = await request(app).post('/admin/characters').send({ name: 'New Character' })
      expect(res.status).toBe(401)
    })
  })

  describe('PUT /admin/characters/:id (requires admin role)', () => {
    const app = createAppWithRoles()

    it('returns 403 when user does not have admin role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['viewer'] } }
      const res = await request(app).put('/admin/characters/student').set('x-test-auth', JSON.stringify(auth)).send({
        name: 'Updated',
      })
      expect(res.status).toBe(403)
    })

    it('returns 200 when user has admin role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['admin'] } }
      const res = await request(app).put('/admin/characters/student').set('x-test-auth', JSON.stringify(auth)).send({
        name: 'Updated',
      })
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('student')
    })
  })

  describe('DELETE /admin/characters/:id (requires admin role)', () => {
    const app = createAppWithRoles()

    it('returns 403 when user does not have admin role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['editor'] } }
      const res = await request(app).delete('/admin/characters/student').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(403)
    })

    it('returns 204 when user has admin role', async () => {
      const auth = { sub: 'user1', realm_access: { roles: ['admin'] } }
      const res = await request(app).delete('/admin/characters/student').set('x-test-auth', JSON.stringify(auth))
      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
    })
  })
})
