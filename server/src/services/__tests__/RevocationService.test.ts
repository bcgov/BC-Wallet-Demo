import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { CredentialModel } from '../../db/models/Credential'
import { IssuedCredentialModel } from '../../db/models/IssuedCredential'
import { RevocationService, extractIssuanceData, validateRevocation } from '../RevocationService'
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
  describe('extractIssuanceData', () => {
    it('extracts revocation metadata from webhook payload', () => {
      const payload = {
        cred_ex_id: 'ex-123',
        connection_id: 'conn-123',
        revoc_reg_id: 'rev-reg-123',
        revocation_id: 'rev-id-456',
        by_format: {
          cred_issue: {
            anoncreds: {
              cred_def_id: 'cred-def-789',
            },
          },
        },
      }

      const result = extractIssuanceData(payload)
      expect(result).not.toBeNull()
      expect(result?._id).toBe('ex-123')
      expect(result?.connection_id).toBe('conn-123')
      expect(result?.format).toBe('anoncreds')
      expect(result?.format_metadata).toEqual({
        rev_reg_id: 'rev-reg-123',
        cred_rev_id: 'rev-id-456',
        cred_def_id: 'cred-def-789',
      })
    })

    it('returns null when revocation metadata is missing', () => {
      const payload = { cred_ex_id: 'ex-123', connection_id: 'conn-123' }
      const result = extractIssuanceData(payload)
      expect(result).toBeNull()
    })

    it('returns null when connection_id is missing', () => {
      const payload = {
        cred_ex_id: 'ex-123',
        revoc_reg_id: 'rev-reg-123',
        revocation_id: 'rev-id-456',
      }
      const result = extractIssuanceData(payload)
      expect(result).toBeNull()
    })

    it('returns null when cred_ex_id is missing', () => {
      const payload = {
        connection_id: 'conn-123',
        revoc_reg_id: 'rev-reg-123',
        revocation_id: 'rev-id-456',
      }
      const result = extractIssuanceData(payload)
      expect(result).toBeNull()
    })
  })

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
  describe('handleCredentialIssued', () => {
    it('persists issued credential doc with cred_ex_id as _id', async () => {
      const credential = await CredentialModel.create({
        name: 'test',
        icon: 'icon',
        version: '1.0',
        attributes: [],
        cred_def_id: 'cred-def-789',
      })

      const payload = {
        cred_ex_id: 'ex-abc-123',
        connection_id: 'conn-123',
        revoc_reg_id: 'rev-reg-123',
        revocation_id: 'rev-id-456',
        by_format: {
          cred_issue: {
            anoncreds: {
              cred_def_id: 'cred-def-789',
            },
          },
        },
      }

      const doc = await service.handleCredentialIssued(payload)
      expect(doc).not.toBeNull()
      expect(doc?._id).toBe('ex-abc-123')
      expect(doc?.connection_id).toBe('conn-123')
      expect(doc?.credential_id).toBe(String(credential._id))
      expect(doc?.status).toBe('issued')
    })

    it('returns null when payload has no revocation metadata', async () => {
      const payload = { cred_ex_id: 'ex-123', connection_id: 'conn-123' }
      const doc = await service.handleCredentialIssued(payload)
      expect(doc).toBeNull()
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
