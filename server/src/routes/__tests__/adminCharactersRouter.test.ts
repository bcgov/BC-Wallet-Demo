import express, { json } from 'express'
import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

// Mock requireRole to allow tests to bypass role checks
vi.mock('../../middleware/requireAdmin', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

import adminCharactersRouter from '../adminCharactersRouter'

const app = express()
app.use(json())
app.use('/admin/characters', adminCharactersRouter)

describe('adminCharactersRouter', () => {
  describe('GET /admin/characters', () => {
    it('returns 200 with a message', async () => {
      const res = await request(app).get('/admin/characters')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('GET /admin/characters/:id', () => {
    it('returns 200 with a message containing the id', async () => {
      const res = await request(app).get('/admin/characters/student')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('student')
    })
  })

  describe('POST /admin/characters', () => {
    it('returns 201 with a message', async () => {
      const res = await request(app).post('/admin/characters').send({ name: 'Test' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('PUT /admin/characters/:id', () => {
    it('returns 200 with a message containing the id', async () => {
      const res = await request(app).put('/admin/characters/student').send({ name: 'Updated' })
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('student')
    })
  })

  describe('DELETE /admin/characters/:id', () => {
    it('returns 204 with no body', async () => {
      const res = await request(app).delete('/admin/characters/student')
      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
    })
  })
})
