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
      mockCredentialController: {
        getAllCredentials: vi.fn(),
        getCredentialById: vi.fn(),
      },
      mockAdminCredentialController: {
        createCredential: vi.fn(),
        updateCredential: vi.fn(),
        deleteCredential: vi.fn(),
      },
      mockAuditLogService: {
        log: vi.fn().mockResolvedValue(undefined),
      },
    },
  }
})

vi.mock('typedi', () => ({
  Container: {
    get: (Type: any) => {
      if (Type.name === 'CredentialController') return mocks.mockCredentialController
      if (Type.name === 'AdminCredentialController') return mocks.mockAdminCredentialController
      if (Type.name === 'AuditLogService') return mocks.mockAuditLogService
      return {}
    },
  },
  Service: () => (target: any) => target,
}))

import adminCredentialsRouter from '../adminCredentialsRouter'

const app = express()
app.use(json())
app.use('/admin/credentials', adminCredentialsRouter)

const mockCredential = {
  id: 'student-card',
  name: 'Student Card',
  icon: '/icon.svg',
  version: '1.0',
  attributes: [],
  schema_id: 'ABC:2:student_card:1.0',
  cred_def_ids: ['ABC:3:CL:100:tag'],
  status: 'active',
}

describe('adminCredentialsRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // GET /admin/credentials
  // ============================================================================

  describe('GET /admin/credentials', () => {
    it('returns 200 with credentials array', async () => {
      mocks.mockCredentialController.getAllCredentials.mockResolvedValue([mockCredential])

      const res = await request(app).get('/admin/credentials')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body[0]).toHaveProperty('name', 'Student Card')
    })

    it('filters by status=active', async () => {
      mocks.mockCredentialController.getAllCredentials.mockResolvedValue([
        { ...mockCredential, status: 'active' },
        { ...mockCredential, id: 'retired-card', status: 'retired' },
      ])

      const res = await request(app).get('/admin/credentials?status=active')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].status).toBe('active')
    })

    it('filters by status=retired', async () => {
      mocks.mockCredentialController.getAllCredentials.mockResolvedValue([
        { ...mockCredential, status: 'active' },
        { ...mockCredential, id: 'retired-card', status: 'retired' },
      ])

      const res = await request(app).get('/admin/credentials?status=retired')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].status).toBe('retired')
    })

    it('filters by schema_name', async () => {
      mocks.mockCredentialController.getAllCredentials.mockResolvedValue([
        { ...mockCredential, name: 'student_card' },
        { ...mockCredential, id: 'member-card', name: 'member_card' },
      ])

      const res = await request(app).get('/admin/credentials?schema_name=student_card')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].name).toBe('student_card')
    })

    it('returns 500 when controller throws', async () => {
      mocks.mockCredentialController.getAllCredentials.mockRejectedValue(new Error('DB error'))

      const res = await request(app).get('/admin/credentials')

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error')
    })
  })

  // ============================================================================
  // DELETE /admin/credentials/:id (soft-delete)
  // ============================================================================

  describe('DELETE /admin/credentials/:id', () => {
    it('returns 200 with retired credential', async () => {
      const retired = { ...mockCredential, status: 'retired' }
      mocks.mockAdminCredentialController.deleteCredential.mockResolvedValue(retired)

      const res = await request(app).delete('/admin/credentials/student-card')

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('status', 'retired')
    })

    it('returns 404 when credential not found', async () => {
      const { NotFoundError } = await import('routing-controllers')
      mocks.mockAdminCredentialController.deleteCredential.mockRejectedValue(new NotFoundError('Credential not found'))

      const res = await request(app).delete('/admin/credentials/nonexistent')

      expect(res.status).toBe(404)
    })

    it('returns 500 on unexpected error', async () => {
      mocks.mockAdminCredentialController.deleteCredential.mockRejectedValue(new Error('DB error'))

      const res = await request(app).delete('/admin/credentials/student-card')

      expect(res.status).toBe(500)
    })
  })
})
