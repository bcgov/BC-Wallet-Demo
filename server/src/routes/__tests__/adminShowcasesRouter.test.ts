import express, { json } from 'express'
import request from 'supertest'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../middleware/requireAdmin', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

// Use vi.hoisted to define mocks outside vi.mock() but at top level
const { mocks } = vi.hoisted(() => {
  return {
    mocks: {
      mockShowcaseController: {
        getShowcases: vi.fn(),
        getShowcaseById: vi.fn(),
      },
      mockAdminShowcaseController: {
        createShowcase: vi.fn(),
        updateShowcase: vi.fn(),
        deleteShowcase: vi.fn(),
        restoreShowcase: vi.fn(),
        getDeletedShowcases: vi.fn(),
        permanentDeleteShowcase: vi.fn(),
      },
    },
  }
})

vi.mock('typedi', () => ({
  Container: {
    get: (Type: any) => {
      if (Type.name === 'ShowcaseController') return mocks.mockShowcaseController
      if (Type.name === 'AdminShowcaseController') return mocks.mockAdminShowcaseController
      return {}
    },
  },
  Service: () => (target: any) => target,
}))

import adminShowcasesRouter from '../adminShowcasesRouter'

const app = express()
app.use(json())
app.use('/admin/showcases', adminShowcasesRouter)

const mockShowcase = {
  _id: 'test-id',
  name: 'student',
  persona: { name: 'Student', type: 'student', image: '/image.svg' },
  credentials: [],
  introduction: [],
  progressBar: [],
  scenarios: [],
}

describe('adminShowcasesRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /admin/showcases', () => {
    it('returns 200 with showcases array', async () => {
      mocks.mockShowcaseController.getShowcases.mockResolvedValue([mockShowcase])
      const res = await request(app).get('/admin/showcases')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('name', 'student')
    })

    it('returns 500 when controller throws error', async () => {
      mocks.mockShowcaseController.getShowcases.mockRejectedValue(new Error('Database error'))
      const res = await request(app).get('/admin/showcases')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch showcases')
    })

    it('returns deleted showcases when ?deleted=true', async () => {
      const deleted = { ...mockShowcase, deleted_at: new Date().toISOString() }
      mocks.mockAdminShowcaseController.getDeletedShowcases.mockResolvedValue({ items: [deleted], total: 1 })
      const res = await request(app).get('/admin/showcases?deleted=true')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('total', 1)
      expect(res.body.items[0]).toHaveProperty('name', 'student')
    })
  })

  describe('GET /admin/showcases/:id', () => {
    it('returns 200 with single showcase', async () => {
      mocks.mockShowcaseController.getShowcaseById.mockResolvedValue(mockShowcase)
      const res = await request(app).get('/admin/showcases/student')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', 'student')
      expect(mocks.mockShowcaseController.getShowcaseById).toHaveBeenCalledWith('student')
    })

    it('returns 404 when showcase not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockShowcaseController.getShowcaseById.mockRejectedValue(new NotFoundError('Showcase not found'))
      const res = await request(app).get('/admin/showcases/nonexistent')
      expect(res.status).toBe(404)
      expect(res.body).toHaveProperty('error')
    })

    it('returns 500 on database error', async () => {
      mocks.mockShowcaseController.getShowcaseById.mockRejectedValue(new Error('DB error'))
      const res = await request(app).get('/admin/showcases/student')
      expect(res.status).toBe(500)
    })
  })

  describe('POST /admin/showcases', () => {
    it('returns 201 with created showcase', async () => {
      mocks.mockAdminShowcaseController.createShowcase.mockResolvedValue(mockShowcase)
      const res = await request(app).post('/admin/showcases').send({ name: 'Test' })
      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('name', 'student')
      expect(mocks.mockAdminShowcaseController.createShowcase).toHaveBeenCalled()
    })

    it('returns 500 on creation error', async () => {
      mocks.mockAdminShowcaseController.createShowcase.mockRejectedValue(new Error('Creation failed'))
      const res = await request(app).post('/admin/showcases').send({ name: 'Test' })
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to create showcase')
    })
  })

  describe('PUT /admin/showcases/:id', () => {
    it('returns 200 with updated showcase', async () => {
      mocks.mockAdminShowcaseController.updateShowcase.mockResolvedValue(mockShowcase)
      const res = await request(app).put('/admin/showcases/student').send({ name: 'Updated' })
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('name', 'student')
      expect(mocks.mockAdminShowcaseController.updateShowcase).toHaveBeenCalledWith('student', { name: 'Updated' })
    })

    it('returns 404 when showcase not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockAdminShowcaseController.updateShowcase.mockRejectedValue(new NotFoundError('Showcase not found'))
      const res = await request(app).put('/admin/showcases/nonexistent').send({ name: 'Updated' })
      expect(res.status).toBe(404)
    })

    it('returns 500 on update error', async () => {
      mocks.mockAdminShowcaseController.updateShowcase.mockRejectedValue(new Error('Update failed'))
      const res = await request(app).put('/admin/showcases/student').send({ name: 'Updated' })
      expect(res.status).toBe(500)
    })
  })

  describe('POST /admin/showcases/:id/restore', () => {
    it('returns 200 with restored showcase', async () => {
      mocks.mockAdminShowcaseController.restoreShowcase.mockResolvedValue({ ...mockShowcase, status: 'pending' })
      const res = await request(app).post('/admin/showcases/student/restore')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'pending')
      expect(mocks.mockAdminShowcaseController.restoreShowcase).toHaveBeenCalledWith('student')
    })

    it('returns 404 when showcase not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockAdminShowcaseController.restoreShowcase.mockRejectedValue(new NotFoundError('Not found'))
      const res = await request(app).post('/admin/showcases/ghost/restore')
      expect(res.status).toBe(404)
    })

    it('returns 409 when showcase is not deleted', async () => {
      const { ShowcaseNotDeletedError } = await import('../../errors')
      mocks.mockAdminShowcaseController.restoreShowcase.mockRejectedValue(new ShowcaseNotDeletedError('student'))
      const res = await request(app).post('/admin/showcases/student/restore')
      expect(res.status).toBe(409)
    })

    it('returns 500 on unexpected error', async () => {
      mocks.mockAdminShowcaseController.restoreShowcase.mockRejectedValue(new Error('DB error'))
      const res = await request(app).post('/admin/showcases/student/restore')
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /admin/showcases/:id?permanent=true', () => {
    it('calls permanentDeleteShowcase when ?permanent=true', async () => {
      mocks.mockAdminShowcaseController.permanentDeleteShowcase.mockResolvedValue(undefined)
      const res = await request(app).delete('/admin/showcases/student?permanent=true')
      expect(res.status).toBe(204)
      expect(mocks.mockAdminShowcaseController.permanentDeleteShowcase).toHaveBeenCalledWith('student')
    })

    it('returns 404 when showcase not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockAdminShowcaseController.permanentDeleteShowcase.mockRejectedValue(new NotFoundError('Not found'))
      const res = await request(app).delete('/admin/showcases/ghost?permanent=true')
      expect(res.status).toBe(404)
    })

    it('returns 409 when showcase is not soft-deleted', async () => {
      const { ShowcaseNotDeletedError } = await import('../../errors')
      mocks.mockAdminShowcaseController.permanentDeleteShowcase.mockRejectedValue(
        new ShowcaseNotDeletedError('student'),
      )
      const res = await request(app).delete('/admin/showcases/student?permanent=true')
      expect(res.status).toBe(409)
    })

    it('returns 500 on unexpected error', async () => {
      mocks.mockAdminShowcaseController.permanentDeleteShowcase.mockRejectedValue(new Error('DB error'))
      const res = await request(app).delete('/admin/showcases/student?permanent=true')
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /admin/showcases/:id', () => {
    it('returns 204 with no body', async () => {
      mocks.mockAdminShowcaseController.deleteShowcase.mockResolvedValue(undefined)
      const res = await request(app).delete('/admin/showcases/student')
      expect(res.status).toBe(204)
      expect(res.body).toEqual({})
      expect(mocks.mockAdminShowcaseController.deleteShowcase).toHaveBeenCalledWith('student')
    })

    it('returns 404 when showcase not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockAdminShowcaseController.deleteShowcase.mockRejectedValue(new NotFoundError('Showcase not found'))
      const res = await request(app).delete('/admin/showcases/nonexistent')
      expect(res.status).toBe(404)
    })

    it('returns 500 on deletion error', async () => {
      mocks.mockAdminShowcaseController.deleteShowcase.mockRejectedValue(new Error('Deletion failed'))
      const res = await request(app).delete('/admin/showcases/student')
      expect(res.status).toBe(500)
    })
  })
})
