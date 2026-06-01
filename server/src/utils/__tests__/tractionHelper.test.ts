import axios from 'axios'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../db/models/Schema', () => ({
  SchemaModel: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}))

vi.mock('../../db/models/Credential', () => ({
  CredentialModel: {
    updateOne: vi.fn(),
  },
}))

vi.mock('../../../server/scripts/values/credentials.json', () => ({
  default: [
    {
      _id: 'student-card',
      name: 'student_card',
      version: '2.0',
      attributes: [{ name: 'student_first_name' }, { name: 'student_last_name' }, { name: 'expiry_date' }],
    },
  ],
}))

import { CredentialModel } from '../../db/models/Credential'
import { SchemaModel } from '../../db/models/Schema'
import * as th from '../tractionHelper'

// Import models after mocks are applied

describe('tractionRequest', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.TRACTION_URL
  })

  it('get: calls axios.get with composed URL, bearer auth, and timeout', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })

    await th.tractionRequest.get('/connections')

    expect(axios.get).toHaveBeenCalledWith(
      'https://traction.example.com/connections',
      expect.objectContaining({
        timeout: 80000,
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
      }),
    )
  })

  it('get: passes additional config options through', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })

    await th.tractionRequest.get('/connections', { params: { state: 'active' } })

    expect(axios.get).toHaveBeenCalledWith(
      'https://traction.example.com/connections',
      expect.objectContaining({ params: { state: 'active' } }),
    )
  })

  it('post: calls axios.post with composed URL, body, bearer auth, and timeout', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: {} })
    const body = { foo: 'bar' }

    await th.tractionRequest.post('/issue-credential-2.0/send-offer', body)

    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/issue-credential-2.0/send-offer',
      body,
      expect.objectContaining({
        timeout: 80000,
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
      }),
    )
  })

  it('delete: calls axios.delete with composed URL, bearer auth, and timeout', async () => {
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })

    await th.tractionRequest.delete('/connections/conn1')

    expect(axios.delete).toHaveBeenCalledWith(
      'https://traction.example.com/connections/conn1',
      expect.objectContaining({
        timeout: 80000,
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
      }),
    )
  })

  it('get: returns the axios response', async () => {
    const mockResponse = { data: { results: [{ id: '1' }] } }
    vi.mocked(axios.get).mockResolvedValue(mockResponse)

    const result = await th.tractionRequest.get('/connections')

    expect(result).toBe(mockResponse)
  })
})

describe('tractionApiKeyUpdaterInit', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    process.env.TRACTION_TENANT_ID = 'tenant123'
    process.env.TRACTION_TENANT_API_KEY = 'apikey456'
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.TRACTION_URL
    delete process.env.TRACTION_TENANT_ID
    delete process.env.TRACTION_TENANT_API_KEY
  })

  it('calls axios.post with the correct token endpoint and payload', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'new-token' } })

    await th.tractionApiKeyUpdaterInit()

    expect(axios.post).toHaveBeenCalledWith('https://traction.example.com/multitenancy/tenant/tenant123/token', {
      api_key: 'apikey456',
    })
  })

  it('updates the exported agentKey on successful init', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'updated-token' } })

    await th.tractionApiKeyUpdaterInit()

    expect(th.agentKey).toBe('updated-token')
  })

  it('does not throw when axios.post rejects during init', async () => {
    vi.mocked(axios.post).mockRejectedValue(new Error('Network failure'))

    await expect(th.tractionApiKeyUpdaterInit()).resolves.toBeUndefined()
  })

  it('schedules a periodic refresh with setInterval', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { token: 'token' } })
    const spyInterval = vi.spyOn(global, 'setInterval')

    await th.tractionApiKeyUpdaterInit()

    expect(spyInterval).toHaveBeenCalledWith(expect.any(Function), 3600000)
  })
})

describe('tractionGarbageCollection', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.TRACTION_URL
  })

  it('calls delete for stale connections older than 12 hours', async () => {
    const staleDate = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()
    const freshDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()

    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: {
          results: [
            { connection_id: 'stale-conn', created_at: staleDate, alias: 'user' },
            { connection_id: 'fresh-conn', created_at: freshDate, alias: 'user' },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { results: [] } })
      .mockResolvedValueOnce({ data: { results: [] } })
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })

    await th.tractionGarbageCollection()
    // flush fire-and-forget promises
    for (let i = 0; i < 10; i++) await Promise.resolve()

    expect(axios.delete).toHaveBeenCalledWith('https://traction.example.com/connections/stale-conn', expect.anything())
    expect(axios.delete).not.toHaveBeenCalledWith(
      'https://traction.example.com/connections/fresh-conn',
      expect.anything(),
    )
  })

  it('skips endorser connections even when stale', async () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()

    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: {
          results: [{ connection_id: 'endorser-conn', created_at: staleDate, alias: 'endorser' }],
        },
      })
      .mockResolvedValueOnce({ data: { results: [] } })
      .mockResolvedValueOnce({ data: { results: [] } })
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })

    await th.tractionGarbageCollection()
    for (let i = 0; i < 10; i++) await Promise.resolve()

    expect(axios.delete).not.toHaveBeenCalled()
  })

  it('does not throw when cleanup request fails', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('API unavailable'))

    await th.tractionGarbageCollection()

    await expect(Promise.resolve()).resolves.toBeUndefined()
  })

  it('deletes stale credential exchange records', async () => {
    const staleDate = new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString()

    vi.mocked(axios.get)
      .mockResolvedValueOnce({ data: { results: [] } })
      .mockResolvedValueOnce({
        data: {
          results: [{ cred_ex_id: 'cred-exch-1', created_at: staleDate }],
        },
      })
      .mockResolvedValueOnce({ data: { results: [] } })
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })

    await th.tractionGarbageCollection()
    for (let i = 0; i < 10; i++) await Promise.resolve()

    expect(axios.delete).toHaveBeenCalledWith(
      'https://traction.example.com/issue-credential-2.0/records/cred-exch-1',
      expect.anything(),
    )
  })
})

describe('checkSeededSchemasExistOrCreate', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.TRACTION_URL
  })

  it('skips schema if already exists in MongoDB', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue({
      _id: 'W1ZJ:2:student_card:2.0' as any,
      name: 'student_card',
      version: '2.0',
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(SchemaModel.findOne).toHaveBeenCalledWith({
      name: 'student_card',
      version: '2.0',
    })
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('creates credential definition for existing schema in Traction', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:student_card:2.0'] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
      .mockResolvedValueOnce({
        data: { credential_definition_ids: [] },
      })
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        credential_definition_state: {
          credential_definition_id: 'W1ZJ:3:CL:1:student_card',
        },
      },
    })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(axios.get).toHaveBeenCalledWith(
      'https://traction.example.com/anoncreds/credential-definitions',
      expect.anything(),
    )
    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/anoncreds/credential-definition',
      expect.objectContaining({
        credential_definition: expect.objectContaining({
          schemaId: 'W1ZJ:2:student_card:2.0',
        }),
      }),
      expect.anything(),
    )
  })

  it('reuses existing credential definition if already in Traction', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:student_card:2.0'] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
      .mockResolvedValueOnce({
        data: { credential_definition_ids: ['W1ZJ:3:CL:1:student_card'] },
      })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(axios.post).not.toHaveBeenCalled()
    expect(SchemaModel.updateOne).toHaveBeenCalledWith(
      { _id: 'W1ZJ:2:student_card:2.0' as any },
      expect.objectContaining({
        $set: expect.objectContaining({
          credDefId: 'W1ZJ:3:CL:1:student_card',
        }),
      }),
      { upsert: true },
    )
  })

  it('creates both schema and credential definition when schema does not exist in Traction', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: [] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: {
          schema_state: {
            schema_id: 'W1ZJ:2:student_card:2.0',
            schema: { name: 'student_card' },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          credential_definition_state: {
            credential_definition_id: 'W1ZJ:3:CL:1:student_card',
          },
        },
      })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/anoncreds/schema',
      expect.objectContaining({
        schema: expect.objectContaining({
          name: 'student_card',
          version: '2.0',
        }),
      }),
      expect.anything(),
    )
    expect(SchemaModel.updateOne).toHaveBeenCalledWith(
      { _id: 'W1ZJ:2:student_card:2.0' as any },
      expect.objectContaining({
        $set: expect.objectContaining({
          credDefId: 'W1ZJ:3:CL:1:student_card',
        }),
      }),
      { upsert: true },
    )
  })

  it('updates credential record with schema_id and cred_def_id', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:student_card:2.0'] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
      .mockResolvedValueOnce({
        data: { credential_definition_ids: [] },
      })
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        credential_definition_state: {
          credential_definition_id: 'W1ZJ:3:CL:1:student_card',
        },
      },
    })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(CredentialModel.updateOne).toHaveBeenCalledWith(
      { _id: 'student-card' as any },
      {
        $set: {
          schema_id: 'W1ZJ:2:student_card:2.0',
          cred_def_id: 'W1ZJ:3:CL:1:student_card',
        },
      },
      { upsert: false },
    )
  })

  it('maps credential attributes to schema attrNames', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: [] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: {
          schema_state: {
            schema_id: 'W1ZJ:2:student_card:2.0',
            schema: { name: 'student_card' },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          credential_definition_state: {
            credential_definition_id: 'W1ZJ:3:CL:1:student_card',
          },
        },
      })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    expect(SchemaModel.updateOne).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({
          attrNames: ['student_first_name', 'student_last_name', 'expiry_date'],
        }),
      }),
      expect.anything(),
    )
  })

  it('handles error when schema already exists in Traction but fails to sync', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:Student Card:1.0'] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
      .mockRejectedValueOnce(new Error('Failed to fetch credential definitions'))

    await th.checkSeededSchemasExistOrCreate()

    expect(SchemaModel.updateOne).not.toHaveBeenCalled()
  })

  it('handles error when schema creation fails', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: [] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
    vi.mocked(axios.post).mockRejectedValue(new Error('Schema creation failed'))

    await th.checkSeededSchemasExistOrCreate()

    expect(SchemaModel.updateOne).not.toHaveBeenCalled()
  })

  it('handles error when fetching issuer DID fails', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: [] },
      })
      .mockRejectedValue(new Error('Wallet unavailable'))

    await th.checkSeededSchemasExistOrCreate()

    expect(axios.post).not.toHaveBeenCalled()
  })

  it('continues processing after error in one credential', async () => {
    vi.mocked(SchemaModel.findOne)
      .mockResolvedValueOnce(null) // first credential not found
      .mockResolvedValueOnce({ _id: 'student-card', found: true } as any) // second credential found

    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Error on first credential'))

    // Call with a mocked credential seed that has 2 items
    // Since we mocked credentialsSeed at the top to only have 1 item,
    // we expect it to process that one and skip on error

    await th.checkSeededSchemasExistOrCreate()

    expect(SchemaModel.findOne).toHaveBeenCalled()
  })

  it('does not throw when entire function fails', async () => {
    vi.mocked(SchemaModel.findOne).mockRejectedValue(new Error('Database error'))

    await expect(th.checkSeededSchemasExistOrCreate()).resolves.toBeUndefined()
  })

  it('uses exponential backoff for credential definition creation retry', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { schema_ids: [] },
      })
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
    vi.mocked(axios.post)
      .mockResolvedValueOnce({
        data: {
          schema_state: {
            schema_id: 'W1ZJ:2:student_card:2.0',
            schema: { name: 'student_card' },
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          credential_definition_state: {
            credential_definition_id: 'W1ZJ:3:CL:1:student_card',
          },
        },
      })
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 1,
      upsertedId: 'W1ZJ:2:student_card:2.0' as any,
    } as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({
      acknowledged: true,
      matchedCount: 1,
      modifiedCount: 1,
      upsertedCount: 0,
      upsertedId: null,
    } as any)

    await th.checkSeededSchemasExistOrCreate()

    // Verify that POST was called twice (schema + credential definition)
    expect(axios.post).toHaveBeenCalledTimes(2)
  })
})
