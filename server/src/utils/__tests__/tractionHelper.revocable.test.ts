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
    vi.mocked(axios.get)
      .mockResolvedValueOnce({
        data: { result: { did: 'W1ZJ' } },
      })
      .mockResolvedValueOnce({
        data: { schema_ids: ['W1ZJ:2:student_card:2.0'] },
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

    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/anoncreds/credential-definition',
      expect.objectContaining({
        options: { support_revocation: false },
      }),
      expect.anything(),
    )
  })
})
