import { BadRequestError } from 'routing-controllers'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock must be declared before imports that use the mocked module.
vi.mock('../../utils/tractionHelper', () => ({
  tractionRequest: { post: vi.fn() },
  retryWithExponentialBackoff: vi.fn((fn: () => Promise<unknown>) => fn()),
}))

vi.mock('../../utils/logger', () => ({
  default: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { tractionRequest, retryWithExponentialBackoff } from '../../utils/tractionHelper'
import {
  TractionRegistrationService,
  buildCredDefPayload,
  buildSchemaPayload,
  extractCredDefId,
  extractSchemaId,
  toRegistrationError,
} from '../TractionRegistrationService'

// ============================================================================
// Pure Functions
// ============================================================================

describe('TractionRegistrationService - Pure Functions', () => {
  describe('buildSchemaPayload', () => {
    it('returns schema object with all fields', () => {
      const result = buildSchemaPayload('Student Card', '1.0', ['name', 'grade'], 'did:indy:abc')
      expect(result).toEqual({
        schema: { name: 'Student Card', version: '1.0', attrNames: ['name', 'grade'], issuerId: 'did:indy:abc' },
      })
    })
  })

  describe('buildCredDefPayload', () => {
    it('applies revocation defaults when options is undefined', () => {
      const result = buildCredDefPayload('did:indy:abc', 'schema-id', 'Student Card')
      expect(result.options).toEqual({ support_revocation: true, revocation_registry_size: 3000 })
    })

    it('allows overriding support_revocation to false', () => {
      const result = buildCredDefPayload('did:indy:abc', 'schema-id', 'Card', { support_revocation: false })
      expect(result.options.support_revocation).toBe(false)
    })

    it('allows overriding revocation_registry_size', () => {
      const result = buildCredDefPayload('did:indy:abc', 'schema-id', 'Card', { revocation_registry_size: 1000 })
      expect(result.options.revocation_registry_size).toBe(1000)
    })

    it('builds credential_definition object with correct fields', () => {
      const result = buildCredDefPayload('did:indy:abc', 'schema-id', 'MyTag')
      expect(result.credential_definition).toEqual({ issuerId: 'did:indy:abc', schemaId: 'schema-id', tag: 'MyTag' })
    })
  })

  describe('extractSchemaId', () => {
    it('returns schema_id from Traction response', () => {
      const res = { data: { schema_state: { schema_id: 'W1ZJ:2:Card:1.0', schema: { name: 'Card' } } } }
      expect(extractSchemaId(res)).toBe('W1ZJ:2:Card:1.0')
    })
  })

  describe('extractCredDefId', () => {
    it('returns credential_definition_id from Traction response', () => {
      const res = { data: { credential_definition_state: { credential_definition_id: 'W1ZJ:3:CL:1:Card' } } }
      expect(extractCredDefId(res)).toBe('W1ZJ:3:CL:1:Card')
    })
  })

  describe('toRegistrationError', () => {
    it('returns BadRequestError for 4xx with Traction detail', () => {
      const axiosErr = {
        isAxiosError: true,
        message: 'Request failed',
        response: { status: 400, data: { detail: 'Schema already exists' } },
      }
      const result = toRegistrationError(axiosErr, 'register schema "Card" v1.0')
      expect(result).toBeInstanceOf(BadRequestError)
      expect(result.message).toContain('Schema already exists')
    })

    it('includes context in error message', () => {
      const axiosErr = {
        isAxiosError: true,
        message: 'Bad request',
        response: { status: 422, data: { detail: 'Invalid issuerId' } },
      }
      const result = toRegistrationError(axiosErr, 'register schema "Card" v1.0')
      expect(result.message).toContain('register schema "Card" v1.0')
    })

    it('falls back to axios message when no Traction detail field', () => {
      const axiosErr = {
        isAxiosError: true,
        message: 'Bad request',
        response: { status: 400, data: {} },
      }
      const result = toRegistrationError(axiosErr, 'ctx')
      expect(result.message).toContain('Bad request')
    })

    it('does not wrap 5xx as BadRequestError', () => {
      const axiosErr = {
        isAxiosError: true,
        message: 'Internal server error',
        response: { status: 500, data: { detail: 'Traction exploded' } },
      }
      const result = toRegistrationError(axiosErr, 'ctx')
      expect(result).not.toBeInstanceOf(BadRequestError)
    })

    it('returns or wraps non-Axios errors without mapping', () => {
      const original = new Error('network timeout')
      expect(toRegistrationError(original, 'ctx')).toBe(original)
      const result = toRegistrationError('string error', 'ctx')
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toContain('string error')
    })
  })
})

// ============================================================================
// Imperative Shell
// ============================================================================

describe('TractionRegistrationService - Imperative Shell', () => {
  let service: TractionRegistrationService

  beforeEach(() => {
    service = new TractionRegistrationService()
    vi.clearAllMocks()
    // Default: retryWithExponentialBackoff just calls the function
    vi.mocked(retryWithExponentialBackoff).mockImplementation((fn: () => Promise<unknown>) => fn())
  })

  describe('registerSchema', () => {
    beforeEach(() => {
      vi.mocked(tractionRequest.post).mockResolvedValue({
        data: { schema_state: { schema_id: 'W1ZJ:2:Card:1.0', schema: { name: 'Card' } } },
      })
    })

    it('POSTs to /anoncreds/schema with payload from buildSchemaPayload', async () => {
      await service.registerSchema('Card', '1.0', ['name'], 'did:indy:abc')
      expect(tractionRequest.post).toHaveBeenCalledWith('/anoncreds/schema', {
        schema: { name: 'Card', version: '1.0', attrNames: ['name'], issuerId: 'did:indy:abc' },
      })
    })

    it('returns schema_id from Traction response', async () => {
      const result = await service.registerSchema('Card', '1.0', ['name'], 'did:indy:abc')
      expect(result).toBe('W1ZJ:2:Card:1.0')
    })

    it('throws BadRequestError when Traction returns 4xx', async () => {
      vi.mocked(tractionRequest.post).mockRejectedValue(
        Object.assign(new Error('Unprocessable'), {
          isAxiosError: true,
          response: { status: 422, data: { detail: 'Invalid issuerId format' } },
        }),
      )
      await expect(service.registerSchema('Card', '1.0', ['name'], 'bad-did')).rejects.toBeInstanceOf(BadRequestError)
    })

    it('rethrows non-4xx errors unchanged', async () => {
      const networkErr = new Error('ECONNREFUSED')
      vi.mocked(tractionRequest.post).mockRejectedValue(networkErr)
      await expect(service.registerSchema('Card', '1.0', ['name'], 'did:indy:abc')).rejects.toBe(networkErr)
    })
  })

  describe('registerCredentialDefinition', () => {
    beforeEach(() => {
      vi.mocked(tractionRequest.post).mockResolvedValue({
        data: { credential_definition_state: { credential_definition_id: 'W1ZJ:3:CL:1:Card' } },
      })
    })

    it('wraps POST in retryWithExponentialBackoff with 3 retries and 1000ms delay', async () => {
      await service.registerCredentialDefinition('did:indy:abc', 'schema-id', 'Card')
      expect(retryWithExponentialBackoff).toHaveBeenCalledWith(expect.any(Function), 3, 1000)
    })

    it('POSTs to /anoncreds/credential-definition with payload from buildCredDefPayload', async () => {
      await service.registerCredentialDefinition('did:indy:abc', 'schema-id', 'Card')
      expect(tractionRequest.post).toHaveBeenCalledWith('/anoncreds/credential-definition', {
        credential_definition: { issuerId: 'did:indy:abc', schemaId: 'schema-id', tag: 'Card' },
        options: { support_revocation: true, revocation_registry_size: 3000 },
      })
    })

    it('returns cred_def_id from Traction response', async () => {
      const result = await service.registerCredentialDefinition('did:indy:abc', 'schema-id', 'Card')
      expect(result).toBe('W1ZJ:3:CL:1:Card')
    })

    it('passes custom options to buildCredDefPayload', async () => {
      await service.registerCredentialDefinition('did:indy:abc', 'schema-id', 'Card', {
        support_revocation: false,
        revocation_registry_size: 1000,
      })
      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/anoncreds/credential-definition',
        expect.objectContaining({
          options: { support_revocation: false, revocation_registry_size: 1000 },
        }),
      )
    })

    it('throws BadRequestError when Traction returns 4xx', async () => {
      vi.mocked(tractionRequest.post).mockRejectedValue(
        Object.assign(new Error('Bad Request'), {
          isAxiosError: true,
          response: { status: 400, data: { detail: 'Schema not found' } },
        }),
      )
      await expect(service.registerCredentialDefinition('did:indy:abc', 'schema-id', 'Card')).rejects.toBeInstanceOf(
        BadRequestError,
      )
    })
  })
})
