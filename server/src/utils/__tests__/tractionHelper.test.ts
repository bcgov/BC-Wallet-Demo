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
    find: vi.fn(),
    updateOne: vi.fn(),
  },
}))

vi.mock('../../db/models/Credential', () => ({
  CredentialModel: {
    updateOne: vi.fn(),
  },
}))

vi.mock('../../db/models/Did', () => ({
  DidModel: {
    updateOne: vi.fn(),
  },
}))

vi.mock('../../../scripts/values/credentials.json', () => ({
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
import { DidModel } from '../../db/models/Did'
import { SchemaModel } from '../../db/models/Schema'
import logger from '../logger'
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

describe('getOrCreateIndyDid', () => {
  it('returns existing posted indy did when present', async () => {
    th.tractionRequest.get = vi.fn().mockResolvedValue({
      data: {
        results: [{ did: 'did:sov:123' }],
      },
    })

    const did = await th.getOrCreateIndyDid()

    expect(did).toBe('did:sov:123')
  })

  it('creates a new indy did when none exist', async () => {
    th.tractionRequest.get = vi.fn().mockResolvedValue({
      data: {
        results: [],
      },
    })

    th.tractionRequest.post = vi.fn().mockResolvedValue({
      data: {
        result: {
          did: 'did:sov:new',
        },
      },
    })

    const did = await th.getOrCreateIndyDid()

    expect(th.tractionRequest.post).toHaveBeenCalledWith('/wallet/did/create', {
      method: 'sov',
    })

    expect(did).toBe('did:sov:new')
  })
})

describe('findSchemaInTraction', () => {
  it('returns schema id when found', async () => {
    th.tractionRequest.get = vi.fn().mockResolvedValue({
      data: {
        schema_ids: ['schema-id-1'],
      },
    })

    const result = await th.findSchemaInTraction('Test', '1.0.0')

    expect(result).toBe('schema-id-1')
  })

  it('returns null when no schemas found', async () => {
    th.tractionRequest.get = vi.fn().mockResolvedValue({
      data: {
        schema_ids: [],
      },
    })

    const result = await th.findSchemaInTraction('Test', '1.0.0')

    expect(result).toBeNull()
  })
})

describe('syncSchemaToDatabase', () => {
  it('updates schema and credential records', async () => {
    const credential: th.SeedCredential = {
      _id: 'credential-id',
      name: 'Person',
      version: '1.0.0',
      attributes: [{ name: 'first_name' }, { name: 'last_name' }],
    }

    await th.syncSchemaToDatabase(credential, 'schema-id', 'creddef-id')

    expect(SchemaModel.updateOne).toHaveBeenCalledWith(
      { _id: 'schema-id' },
      {
        $set: {
          name: 'Person',
          version: '1.0.0',
          attrNames: ['first_name', 'last_name'],
          credDefId: 'creddef-id',
        },
      },
      { upsert: true },
    )

    expect(CredentialModel.updateOne).toHaveBeenCalledWith(
      { _id: 'credential-id' },
      {
        $set: {
          schema_id: 'schema-id',
          cred_def_id: 'creddef-id',
        },
      },
    )
  })
})

describe('populateMissingSchemaDids', () => {
  it('updates only schemas missing a did', async () => {
    SchemaModel.find = vi.fn().mockResolvedValue([
      {
        _id: '1',
        name: 'Schema1',
        version: '1.0.0',
        did: undefined,
      },
      {
        _id: '2',
        name: 'Schema2',
        version: '1.0.0',
        did: 'existing-did',
      },
    ])

    await th.populateMissingSchemaDids('issuerDid')

    expect(SchemaModel.updateOne).toHaveBeenCalledTimes(2)

    expect(SchemaModel.updateOne).toHaveBeenCalledWith(
      { _id: '1' },
      {
        $set: {
          did: 'issuerDid',
        },
      },
      { upsert: true },
    )
  })
})

it('returns immediately when schema already exists in database', async () => {
  SchemaModel.findOne = vi.fn().mockResolvedValue({
    _id: 'schema-id',
    credDefId: 'cred-def-id',
    did: 'issuerDid',
  })

  const findSchemaInTractionSpy = vi.spyOn(th, 'findSchemaInTraction')
  const createSchemaSpy = vi.spyOn(th, 'createSchema')
  const getOrCreateCredDefSpy = vi.spyOn(th, 'getOrCreateCredDef')

  const credential: th.SeedCredential = {
    _id: 'credential-id',
    name: 'Person',
    version: '1.0.0',
    attributes: [{ name: 'first_name' }, { name: 'last_name' }],
  }

  await th.processSeededCredential(credential, 'issuerDid')

  expect(findSchemaInTractionSpy).not.toHaveBeenCalled()
  expect(createSchemaSpy).not.toHaveBeenCalled()
  expect(getOrCreateCredDefSpy).not.toHaveBeenCalled()
})

describe('checkSeededSchemasExistOrCreate', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.TRACTION_URL
  })

  it('logs when checking starts', async () => {
    // Mock all axios calls to succeed
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        results: [{ did: 'did:sov:123' }],
      },
    })
    vi.mocked(axios.post).mockResolvedValue({
      data: {
        schema_state: {
          schema_id: 'schema-1',
          schema: { name: 'test', version: '1.0' },
        },
        credential_definition_state: {
          credential_definition_id: 'cred-def-1',
        },
      },
    })
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(SchemaModel.updateOne).mockResolvedValue({} as any)
    vi.mocked(CredentialModel.updateOne).mockResolvedValue({} as any)
    vi.mocked(DidModel.updateOne).mockResolvedValue({} as any)
    vi.mocked(SchemaModel.find).mockResolvedValue([])

    await th.checkSeededSchemasExistOrCreate()

    expect(vi.mocked(logger.info)).toHaveBeenCalledWith('Checking seeded schemas')
  })

  it('does not rethrow errors, allowing server to continue', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Fatal error'))

    await expect(th.checkSeededSchemasExistOrCreate()).resolves.toBeUndefined()
    expect(vi.mocked(logger.error)).toHaveBeenCalled()
  })

  it('logs error when an error occurs during DID retrieval', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('API unavailable'))

    await th.checkSeededSchemasExistOrCreate()

    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(expect.any(Object), 'Failed to process seeded schemas')
  })
})
