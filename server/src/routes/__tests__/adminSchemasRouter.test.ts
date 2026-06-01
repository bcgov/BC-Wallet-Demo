import express, { json } from 'express'
import request from 'supertest'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('express-rate-limit', () => ({
  default: () => (_req: any, _res: any, next: any) => next(),
}))

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../middleware/requireAdmin', () => ({
  requireRole: () => (_req: any, _res: any, next: any) => next(),
}))

const { mocks } = vi.hoisted(() => {
  return {
    mocks: {
      mockSchemaModel: {
        find: vi.fn(),
        updateOne: vi.fn(),
      },
      mockTractionRequest: {
        get: vi.fn(),
        post: vi.fn(),
      },
      mockAuditLogService: {
        log: vi.fn().mockResolvedValue(undefined),
      },
      mockRetryWithExponentialBackoff: vi.fn(),
    },
  }
})

vi.mock('../../db/models/Schema', () => ({
  SchemaModel: mocks.mockSchemaModel,
}))

vi.mock('../../utils/tractionHelper', () => ({
  tractionRequest: mocks.mockTractionRequest,
  retryWithExponentialBackoff: mocks.mockRetryWithExponentialBackoff,
}))

vi.mock('typedi', () => ({
  Container: {
    get: (Type: any) => {
      if (Type.name === 'AuditLogService') return mocks.mockAuditLogService
      return {}
    },
  },
  Service: () => (target: any) => target,
}))

import adminSchemasRouter from '../adminSchemasRouter'

const app = express()
app.use(json())
app.use('/admin', adminSchemasRouter)

const mockSchema = {
  _id: 'W1ZJ:2:Student Card:1.0',
  name: 'Student Card',
  version: '1.0',
  attrNames: ['name', 'grade'],
  credDefId: 'W1ZJ:3:CL:1:Student Card',
}

const mockIssuerDid = 'W1ZJ'

describe('adminSchemasRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // GET /admin/schemas
  // ============================================================================

  describe('GET /admin/schemas', () => {
    it('returns 200 with schemas array', async () => {
      mocks.mockSchemaModel.find.mockResolvedValue([mockSchema])

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toHaveProperty('name', 'Student Card')
    })

    it('returns 200 with empty array when no schemas exist', async () => {
      mocks.mockSchemaModel.find.mockResolvedValue([])

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(0)
    })

    it('returns 200 with multiple schemas', async () => {
      const schema2 = { ...mockSchema, _id: 'W1ZJ:2:Employee Card:1.0', name: 'Employee Card' }
      mocks.mockSchemaModel.find.mockResolvedValue([mockSchema, schema2])

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it('returns 500 when database query fails', async () => {
      mocks.mockSchemaModel.find.mockRejectedValue(new Error('Database connection error'))

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch schemas from MongoDB')
    })

    it('calls SchemaModel.find()', async () => {
      mocks.mockSchemaModel.find.mockResolvedValue([])

      await request(app).get('/admin/schemas')

      expect(mocks.mockSchemaModel.find).toHaveBeenCalledWith()
    })
  })

  // ============================================================================
  // POST /admin/schemas
  // ============================================================================

  describe('POST /admin/schemas', () => {
    const schemaPayload = {
      name: 'Driver License',
      version: '2.0',
      attrNames: ['name', 'address', 'license_number'],
    }

    const tractionSchemaResponse = {
      data: {
        schema_state: {
          schema_id: 'W1ZJ:2:Driver License:2.0',
          schema: {
            name: 'Driver License',
            version: '2.0',
            attrNames: ['name', 'address', 'license_number'],
          },
        },
      },
    }

    const tractionCredDefResponse = {
      data: {
        credential_definition_state: {
          credential_definition_id: 'W1ZJ:3:CL:123:Driver License',
        },
      },
    }

    it('returns 201 with created schema and cred def', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id', 'W1ZJ:2:Driver License:2.0')
      expect(res.body).toHaveProperty('name', 'Driver License')
      expect(res.body).toHaveProperty('version', '2.0')
      expect(res.body).toHaveProperty('attrNames')
      expect(res.body).toHaveProperty('credDefId', 'W1ZJ:3:CL:123:Driver License')
    })

    it('fetches issuer DID from Traction wallet', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockTractionRequest.get).toHaveBeenCalledWith('/wallet/did/public')
    })

    it('creates schema in Traction with correct payload', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockTractionRequest.post).toHaveBeenCalledWith(
        '/anoncreds/schema',
        expect.objectContaining({
          schema: expect.objectContaining({
            name: 'Driver License',
            version: '2.0',
            attrNames: ['name', 'address', 'license_number'],
            issuerId: mockIssuerDid,
          }),
        }),
      )
    })

    it('creates credential definition with exponential backoff retry', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockRetryWithExponentialBackoff).toHaveBeenCalledWith(
        expect.any(Function),
        3, // maxAttempts
        1000, // initialDelayMs
      )
    })

    it('creates credential definition with revocation support', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      const credDefCall = mocks.mockRetryWithExponentialBackoff.mock.calls[0][0]
      await credDefCall() // Execute the function

      expect(mocks.mockTractionRequest.post).toHaveBeenCalledWith(
        '/anoncreds/credential-definition',
        expect.objectContaining({
          options: {
            support_revocation: true,
            revocation_registry_size: 3000,
          },
        }),
      )
    })

    it('saves schema to MongoDB with upsert', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockSchemaModel.updateOne).toHaveBeenCalledWith(
        { _id: 'W1ZJ:2:Driver License:2.0' },
        {
          $set: {
            name: 'Driver License',
            version: '2.0',
            attrNames: ['name', 'address', 'license_number'],
            credDefId: 'W1ZJ:3:CL:123:Driver License',
          },
        },
        { upsert: true },
      )
    })

    it('logs audit entry after response is sent', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      // Response should be sent before audit logging completes
      expect(res.status).toBe(201)

      // Give async logging time to complete
      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'created',
          resource_type: 'schema',
          resource_id: 'W1ZJ:2:Driver License:2.0',
          details: expect.objectContaining({
            name: 'Driver License',
            version: '2.0',
          }),
        }),
      )
    })

    it('includes user_id from request auth in audit log', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: expect.any(String),
        }),
      )
    })

    it('handles missing user_id with "unknown"', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })

      await request(app).post('/admin/schemas').send(schemaPayload)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'unknown',
        }),
      )
    })

    it('returns 500 when fetching issuer DID fails', async () => {
      mocks.mockTractionRequest.get.mockRejectedValue(new Error('Traction API error'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to create schema and cred def in Traction')
    })

    it('returns 500 when creating schema in Traction fails', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockRejectedValue(new Error('Schema creation failed'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to create schema and cred def in Traction')
    })

    it('returns 500 when creating credential definition fails', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockRejectedValue(new Error('Credential def creation failed'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to create schema and cred def in Traction')
    })

    it('returns 500 when saving to MongoDB fails', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockRejectedValue(new Error('MongoDB error'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to create schema and cred def in Traction')
    })

    it('continues on audit log error', async () => {
      mocks.mockTractionRequest.get.mockResolvedValue({
        data: { result: { did: mockIssuerDid } },
      })
      mocks.mockTractionRequest.post.mockResolvedValue(tractionSchemaResponse)
      mocks.mockRetryWithExponentialBackoff.mockResolvedValue(tractionCredDefResponse)
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })
      mocks.mockAuditLogService.log.mockRejectedValue(new Error('Audit log error'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      // Response should still be 201 even if audit logging fails
      expect(res.status).toBe(201)
    })
  })
})
