import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { CredentialModel } from '../../db/models/Credential'
import { IssuedCredentialModel, type LeanIssuedCredentialDoc } from '../../db/models/IssuedCredential'
import { RevocationService, validateRevocation } from '../RevocationService'
import * as revocationHandlers from '../revocationHandlers'

vi.mock('../revocationHandlers')

let mongod: MongoMemoryServer
let service: RevocationService

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  await IssuedCredentialModel.syncIndexes()
  await CredentialModel.syncIndexes()
  service = new RevocationService()
})

afterEach(async () => {
  await IssuedCredentialModel.deleteMany({})
  await CredentialModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('RevocationService - Pure Functions', () => {
  describe('validateRevocation', () => {
    it('returns error if credential already revoked', () => {
      const doc = {
        _id: 'issued-1',
        credential_id: 'cred-1',
        connection_id: 'conn-1',
        format: 'anoncreds' as const,
        status: 'revoked' as const,
        revoked_at: new Date(),
        format_metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const error = validateRevocation(doc)
      expect(error).toBe('credential already revoked')
    })

    it('returns error if format unsupported', () => {
      const doc = {
        _id: 'issued-1',
        credential_id: 'cred-1',
        connection_id: 'conn-1',
        format: 'mdoc' as any,
        status: 'issued' as const,
        revoked_at: null,
        format_metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const error = validateRevocation(doc)
      expect(error).toMatch(/unsupported format/)
    })

    it('returns null on valid credential', () => {
      const doc = {
        _id: 'issued-1',
        credential_id: 'cred-1',
        connection_id: 'conn-1',
        format: 'anoncreds' as const,
        status: 'issued' as const,
        revoked_at: null,
        format_metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const error = validateRevocation(doc)
      expect(error).toBeNull()
    })
  })
})

describe('RevocationService - Imperative Shell', () => {
  describe('handleIssuerCredRev', () => {
    it('creates IssuedCredential doc with revocation metadata', async () => {
      await service.handleIssuerCredRev({
        cred_ex_id: 'ex-icr-1',
        rev_reg_id: 'rev-reg-123',
        cred_rev_id: '5',
        state: 'issued',
      })
      const doc = await IssuedCredentialModel.findById('ex-icr-1').lean<LeanIssuedCredentialDoc>()
      expect(doc).not.toBeNull()
      expect(doc?.format).toBe('anoncreds')
      expect(doc?.format_metadata).toMatchObject({ rev_reg_id: 'rev-reg-123', cred_rev_id: '5' })
      expect(doc?.connection_id).toBeUndefined()
    })

    it('skips when required fields missing', async () => {
      await service.handleIssuerCredRev({ cred_ex_id: 'ex-icr-2' })
      const count = await IssuedCredentialModel.countDocuments({ _id: 'ex-icr-2' })
      expect(count).toBe(0)
    })

    it('is idempotent on duplicate delivery', async () => {
      const payload = { cred_ex_id: 'ex-icr-idem', rev_reg_id: 'rr', cred_rev_id: '1', state: 'issued' }
      await service.handleIssuerCredRev(payload)
      await service.handleIssuerCredRev(payload)
      const count = await IssuedCredentialModel.countDocuments({ _id: 'ex-icr-idem' })
      expect(count).toBe(1)
    })
  })

  describe('handleCredentialIssued', () => {
    it('updates connection_id and credential_id on existing doc', async () => {
      const credential = await CredentialModel.create({
        name: 'test',
        icon: 'icon',
        version: '1.0',
        attributes: [],
        cred_def_id: 'cred-def-789',
      })
      await service.handleIssuerCredRev({ cred_ex_id: 'ex-ci-1', rev_reg_id: 'rr', cred_rev_id: '7', state: 'issued' })

      const doc = await service.handleCredentialIssued({
        cred_ex_id: 'ex-ci-1',
        connection_id: 'conn-123',
        by_format: { cred_issue: { anoncreds: { cred_def_id: 'cred-def-789' } } },
      })
      expect(doc).not.toBeNull()
      expect(doc?._id).toBe('ex-ci-1')
      expect(doc?.connection_id).toBe('conn-123')
      expect(doc?.credential_id).toBe(String(credential._id))
      expect(doc?.status).toBe('issued')
    })

    it('returns null when no IssuedCredential doc exists (non-revocable credential)', async () => {
      const doc = await service.handleCredentialIssued({ cred_ex_id: 'ex-none', connection_id: 'conn-123' })
      expect(doc).toBeNull()
    })

    it('returns null when cred_ex_id or connection_id missing', async () => {
      expect(await service.handleCredentialIssued({ connection_id: 'conn-123' })).toBeNull()
      expect(await service.handleCredentialIssued({ cred_ex_id: 'ex-123' })).toBeNull()
    })
  })

  describe('revokeCredential', () => {
    it('revokes credential and updates status', async () => {
      const credential = await CredentialModel.create({
        name: 'test',
        icon: 'icon',
        version: '1.0',
        attributes: [],
      })

      await IssuedCredentialModel.create({
        _id: 'ex-revoke-1',
        credential_id: String(credential._id),
        connection_id: 'conn-123',
        format: 'anoncreds',
        status: 'issued',
        format_metadata: {
          rev_reg_id: 'rev-reg-123',
          cred_rev_id: 'rev-id-456',
        },
      })

      const mockHandler = vi.fn().mockResolvedValue(undefined)
      vi.mocked(revocationHandlers.revocationHandlers).anoncreds = mockHandler

      const updated = await service.revokeCredential('ex-revoke-1')

      expect(updated.status).toBe('revoked')
      expect(updated.revoked_at).not.toBeNull()
      expect(mockHandler).toHaveBeenCalledWith(
        {
          rev_reg_id: 'rev-reg-123',
          cred_rev_id: 'rev-id-456',
        },
        'conn-123',
      )
    })

    it('updates DB status before calling Traction handler', async () => {
      const credential = await CredentialModel.create({
        name: 'test',
        icon: 'icon',
        version: '1.0',
        attributes: [],
      })

      await IssuedCredentialModel.create({
        _id: 'ex-order-1',
        credential_id: String(credential._id),
        connection_id: 'conn-123',
        format: 'anoncreds',
        status: 'issued',
        format_metadata: { rev_reg_id: 'r1', cred_rev_id: 'c1' },
      })

      const mockHandler = vi.fn().mockRejectedValue(new Error('Traction down'))
      vi.mocked(revocationHandlers.revocationHandlers).anoncreds = mockHandler

      await expect(service.revokeCredential('ex-order-1')).rejects.toThrow('Traction down')

      const dbDoc = await IssuedCredentialModel.findById('ex-order-1').lean<LeanIssuedCredentialDoc>()
      expect(dbDoc?.status).toBe('revoked')
    })
  })

  describe('getByConnection', () => {
    it('returns credentials for a connection', async () => {
      await IssuedCredentialModel.create([
        {
          _id: 'ex-conn-1',
          credential_id: 'cred-1',
          connection_id: 'conn-123',
          format: 'anoncreds',
          status: 'issued',
          format_metadata: {},
        },
        {
          _id: 'ex-conn-2',
          credential_id: 'cred-2',
          connection_id: 'conn-456',
          format: 'anoncreds',
          status: 'issued',
          format_metadata: {},
        },
      ])

      const docs = await service.getByConnection('conn-123')
      expect(docs).toHaveLength(1)
      expect(docs[0].connection_id).toBe('conn-123')
    })
  })
})
