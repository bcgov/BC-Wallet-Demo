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

// Seed credential with revocable: false -- separate file so this mock doesn't
// affect the main tractionHelper.test.ts suite.
vi.mock('../../../scripts/values/credentials.json', () => ({
  default: [
    {
      _id: 'student-card',
      name: 'student_card',
      version: '2.0',
      revocable: false,
      attributes: [{ name: 'student_first_name' }],
    },
  ],
}))

import { CredentialModel } from '../../db/models/Credential'
import { DidModel } from '../../db/models/Did'
import { SchemaModel } from '../../db/models/Schema'
import * as th from '../tractionHelper'

describe('checkSeededSchemasExistOrCreate -- revocable: false', () => {
  beforeEach(() => {
    process.env.TRACTION_URL = 'https://traction.example.com'
    vi.clearAllMocks()
  })

  afterEach(() => {
    delete process.env.TRACTION_URL
  })

  it('creates credential definition without revocation support when seed has revocable: false', async () => {
    vi.mocked(SchemaModel.findOne).mockResolvedValue(null)
    vi.mocked(SchemaModel.find).mockResolvedValue([])
    vi.mocked(DidModel.updateOne).mockResolvedValue({} as any)
    vi.mocked(axios.get)
      // getOrCreateIndyDid: GET /wallet/did (method: sov)
      .mockResolvedValueOnce({
        data: { results: [{ did: 'W1ZJ' }] },
      })
      // getOrCreateWebvhDid: GET /wallet/did (method: webvh)
      .mockResolvedValueOnce({
        data: { results: [{ did: 'webvh:did:example' }] },
      })
      // findSchemaInTraction: GET /anoncreds/schemas
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:student_card:2.0'] },
      })
      // getOrCreateCredDef: GET /anoncreds/credential-definitions
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

    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/anoncreds/credential-definition',
      expect.objectContaining({
        options: { support_revocation: false },
      }),
      expect.anything(),
    )
  })
})
