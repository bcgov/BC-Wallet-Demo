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
        find: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([]),
        }),
        updateOne: vi.fn(),
        findById: vi.fn().mockResolvedValue(null),
      },
      mockDidModel: {
        findById: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue(null),
        }),
      },
      mockTractionRequest: {
        get: vi.fn(),
        post: vi.fn(),
      },
      mockAuditLogService: {
        log: vi.fn().mockResolvedValue(undefined),
      },
      mockTractionRegistrationService: {
        registerSchema: vi.fn(),
        registerCredentialDefinition: vi.fn(),
      },
      mockRetryWithExponentialBackoff: vi.fn(),
    },
  }
})

vi.mock('../../db/models/Schema', () => ({
  SchemaModel: mocks.mockSchemaModel,
}))

vi.mock('../../db/models/Did', () => ({
  DidModel: mocks.mockDidModel,
}))

vi.mock('../../utils/tractionHelper', () => ({
  tractionRequest: mocks.mockTractionRequest,
  retryWithExponentialBackoff: mocks.mockRetryWithExponentialBackoff,
}))

vi.mock('typedi', () => ({
  Container: {
    get: (Type: any) => {
      if (Type.name === 'AuditLogService') return mocks.mockAuditLogService
      if (Type.name === 'TractionRegistrationService') return mocks.mockTractionRegistrationService
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
      mocks.mockSchemaModel.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockSchema]),
      })

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(1)
      expect(res.body[0]).toHaveProperty('name', 'Student Card')
    })

    it('returns 200 with empty array when no schemas exist', async () => {
      mocks.mockSchemaModel.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      })

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body).toHaveLength(0)
    })

    it('returns 200 with multiple schemas', async () => {
      const schema2 = { ...mockSchema, _id: 'W1ZJ:2:Employee Card:1.0', name: 'Employee Card' }
      mocks.mockSchemaModel.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue([mockSchema, schema2]),
      })

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(2)
    })

    it('returns 500 when database query fails', async () => {
      mocks.mockSchemaModel.find.mockReturnValue({
        lean: vi.fn().mockRejectedValue(new Error('Database connection error')),
      })

      const res = await request(app).get('/admin/schemas')

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error', 'Failed to fetch schemas from MongoDB')
    })

    it('calls SchemaModel.find()', async () => {
      mocks.mockSchemaModel.find.mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      })

      await request(app).get('/admin/schemas')

      expect(mocks.mockSchemaModel.find).toHaveBeenCalledWith()
    })
  })

  // ============================================================================
  // POST /admin/schemas
  // ============================================================================

  describe('POST /admin/schemas', () => {
    const schemaPayload = {
      did: mockIssuerDid,
      name: 'Driver License',
      version: '2.0',
      attributes: [
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'address',
          type: 'string',
        },
        {
          name: 'license_number',
          type: 'string',
        },
      ],
    }

    beforeEach(() => {
      mocks.mockTractionRegistrationService.registerSchema.mockResolvedValue('W1ZJ:2:Driver License:2.0')
      mocks.mockTractionRegistrationService.registerCredentialDefinition.mockResolvedValue(
        'W1ZJ:3:CL:123:Driver License',
      )
      mocks.mockSchemaModel.updateOne.mockResolvedValue({ upserted: true })
      mocks.mockSchemaModel.findById.mockResolvedValue({
        _id: 'W1ZJ:2:Driver License:2.0',
        name: 'Driver License',
        version: '2.0',
        attrNames: ['name', 'address', 'license_number'],
        credDefId: 'W1ZJ:3:CL:123:Driver License',
      })
    })

    it('returns 201 with created schema and cred def', async () => {
      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id', 'W1ZJ:2:Driver License:2.0')
      expect(res.body).toHaveProperty('name', 'Driver License')
      expect(res.body).toHaveProperty('version', '2.0')
      expect(res.body).toHaveProperty('attrNames')
      expect(res.body).toHaveProperty('credDefId', 'W1ZJ:3:CL:123:Driver License')
    })

    it('calls registerSchema with correct args', async () => {
      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockTractionRegistrationService.registerSchema).toHaveBeenCalledWith(
        'Driver License',
        '2.0',
        ['name', 'address', 'license_number'],
        mockIssuerDid,
      )
    })

    it('calls registerCredentialDefinition with correct args', async () => {
      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockTractionRegistrationService.registerCredentialDefinition).toHaveBeenCalledWith(
        mockIssuerDid,
        'W1ZJ:2:Driver License:2.0',
        'Driver License',
      )
    })

    it('saves schema to MongoDB with correct data', async () => {
      await request(app).post('/admin/schemas').send(schemaPayload)

      expect(mocks.mockSchemaModel.updateOne).toHaveBeenCalledWith(
        { _id: 'W1ZJ:2:Driver License:2.0' },
        {
          $set: {
            name: 'Driver License',
            version: '2.0',
            attributes: expect.any(Array),
            credDefId: 'W1ZJ:3:CL:123:Driver License',
            did: mockIssuerDid,
          },
        },
        { upsert: true },
      )
    })

    it('logs audit entry after response is sent', async () => {
      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(201)

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
      await request(app).post('/admin/schemas').send(schemaPayload)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: expect.any(String),
        }),
      )
    })

    it('handles missing user_id with "unknown"', async () => {
      await request(app).post('/admin/schemas').send(schemaPayload)

      await new Promise((resolve) => setTimeout(resolve, 10))

      expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'unknown',
        }),
      )
    })

    it('returns 500 when fetching issuer DID fails', async () => {
      const payloadWithoutDid = {
        name: 'Driver License',
        version: '2.0',
        attributes: [{ name: 'name', type: 'string' }],
      }

      mocks.mockTractionRegistrationService.registerSchema.mockRejectedValue(new Error('issuerId is required'))

      const res = await request(app).post('/admin/schemas').send(payloadWithoutDid)

      expect(res.status).toBe(500)
    })

    it('returns 500 when creating schema in Traction fails', async () => {
      mocks.mockTractionRegistrationService.registerSchema.mockRejectedValue(new Error('Schema creation failed'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Failed to create schema and cred def in Traction')
      expect(res.body.error).toContain('Schema creation failed')
    })

    it('returns 500 when creating credential definition fails', async () => {
      mocks.mockTractionRegistrationService.registerCredentialDefinition.mockRejectedValue(
        new Error('Credential def creation failed'),
      )

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Failed to create schema and cred def in Traction')
      expect(res.body.error).toContain('Credential def creation failed')
    })

    it('returns 500 when saving to MongoDB fails', async () => {
      mocks.mockSchemaModel.updateOne.mockRejectedValue(new Error('MongoDB error'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(500)
      expect(res.body).toHaveProperty('error')
      expect(res.body.error).toContain('Failed to create schema and cred def in Traction')
      expect(res.body.error).toContain('MongoDB error')
    })

    it('continues on audit log error', async () => {
      mocks.mockAuditLogService.log.mockRejectedValue(new Error('Audit log error'))

      const res = await request(app).post('/admin/schemas').send(schemaPayload)

      expect(res.status).toBe(201)
    })
  })
})
