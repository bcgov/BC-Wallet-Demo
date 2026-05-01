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

// requireAdmin is already applied in index.ts; here we test the router in
// isolation by mounting it without the middleware.
import adminShowcasesRouter from '../adminShowcasesRouter'

const app = express()
app.use(json())
app.use('/admin/showcases', adminShowcasesRouter)

describe('adminShowcasesRouter', () => {
  describe('GET /admin/showcases', () => {
    it('returns 200 with a message', async () => {
      const res = await request(app).get('/admin/showcases')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('GET /admin/showcases/:id', () => {
    it('returns 200 with a message containing the id', async () => {
      const res = await request(app).get('/admin/showcases/student')
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('student')
    })
  })

  describe('POST /admin/showcases', () => {
    it('returns 201 with a message', async () => {
      const res = await request(app).post('/admin/showcases').send({ name: 'Test' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('PUT /admin/showcases/:id', () => {
    it('returns 200 with a message containing the id', async () => {
      const res = await request(app).put('/admin/showcases/student').send({ name: 'Updated' })
      expect(res.status).toBe(200)
      expect(res.body.message).toContain('student')
    })
  })

  describe('DELETE /admin/showcases/:id', () => {
    it('returns 204 with no body', async () => {
      const res = await request(app).delete('/admin/showcases/student')
      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
    })
  })
})
