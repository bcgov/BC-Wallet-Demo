import express, { json } from 'express'
import request from 'supertest'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../middleware/requireAdmin', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

const { mocks } = vi.hoisted(() => {
  return {
    mocks: {
      mockAuditLogService: {
        query: vi.fn(),
      },
    },
  }
})

vi.mock('typedi', () => ({
  Container: {
    get: () => mocks.mockAuditLogService,
  },
  Service: () => (target: any) => target,
}))

import adminAuditLogRouter from '../adminAuditLogRouter'

const app = express()
app.use(json())
app.use('/admin/audit-log', adminAuditLogRouter)

const mockQueryResult = {
  data: [
    {
      createdAt: new Date('2026-01-01').toISOString(),
      user_id: 'user-123',
      action: 'created',
      resource_type: 'showcase',
      resource_id: 'showcase-abc',
    },
  ],
  total: 1,
  page: 1,
  limit: 50,
}

describe('adminAuditLogRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /admin/audit-log', () => {
    it('returns 200 with paginated audit log', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      const res = await request(app).get('/admin/audit-log')
      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('data')
      expect(res.body).toHaveProperty('total', 1)
      expect(res.body).toHaveProperty('page', 1)
      expect(res.body).toHaveProperty('limit', 50)
    })

    it('uses default pagination values', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 50 }))
    })

    it('passes page and limit from query params', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue({ ...mockQueryResult, page: 2, limit: 10 })

      await request(app).get('/admin/audit-log?page=2&limit=10')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(expect.objectContaining({ page: 2, limit: 10 }))
    })

    it('clamps limit to 200 maximum', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?limit=9999')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(expect.objectContaining({ limit: 200 }))
    })

    it('clamps limit to 1 minimum', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?limit=0')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }))
    })

    it('parses startDate and endDate from ISO strings', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?startDate=2026-01-01&endDate=2026-12-31')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
        }),
      )
    })

    it('passes single action filter', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?action=created')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({ actions: ['created'] }),
      )
    })

    it('passes comma-separated action filter', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?action=created,deleted')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({ actions: ['created', 'deleted'] }),
      )
    })

    it('ignores invalid action values in filter', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?action=bogus')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({ actions: undefined }),
      )
    })

    it('passes resource_type filter', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?resource_type=showcase,credential_definition')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({ resourceTypes: ['showcase', 'credential_definition'] }),
      )
    })

    it('passes user_id filter', async () => {
      mocks.mockAuditLogService.query.mockResolvedValue(mockQueryResult)

      await request(app).get('/admin/audit-log?user_id=user-123')

      expect(mocks.mockAuditLogService.query).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-123' }),
      )
    })

    it('returns 400 for invalid startDate', async () => {
      const res = await request(app).get('/admin/audit-log?startDate=not-a-date')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Invalid startDate')
    })

    it('returns 400 for invalid endDate', async () => {
      const res = await request(app).get('/admin/audit-log?endDate=not-a-date')
      expect(res.status).toBe(400)
      expect(res.body).toHaveProperty('error', 'Invalid endDate')
    })

    it('returns 500 when service throws', async () => {
      mocks.mockAuditLogService.query.mockRejectedValue(new Error('DB error'))

      const res = await request(app).get('/admin/audit-log')
      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch audit log')
    })
  })
})
