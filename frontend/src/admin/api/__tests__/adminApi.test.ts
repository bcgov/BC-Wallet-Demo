import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getAllCredentials,
  getAvailableSchemas,
  getSchemaById,
  createSchema,
  getAvailableDids,
  getAvailableImages,
  updateCredential,
} from '../adminApi'

const mockAuth = {
  user: { access_token: 'test-token' },
} as any

describe('getAllCredentials', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests ?status=active to exclude retired credentials', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)

    await getAllCredentials(mockAuth)

    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('status=active')
  })

  it('returns the credentials from the response', async () => {
    const credentials = [{ id: 'student-card', name: 'student_card', status: 'active' }]
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => credentials,
    } as any)

    const result = await getAllCredentials(mockAuth)

    expect(result).toEqual(credentials)
  })

  it('throws when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as any)

    await expect(getAllCredentials(mockAuth)).rejects.toThrow('Request failed: 500')
  })
})

describe('getAvailableSchemas', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches all available schemas', async () => {
    const schemas = [{ id: 'schema-1', name: 'Test Schema', version: '1.0', attributes: [] }]
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => schemas,
    } as any)

    const result = await getAvailableSchemas(mockAuth)

    expect(result).toEqual(schemas)
  })

  it('includes authorization header with token', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as any)

    await getAvailableSchemas(mockAuth)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
      }),
    })
  })
})

describe('getSchemaById', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches a single schema by ID', async () => {
    const schema = { id: 'schema-1', name: 'Test Schema', version: '1.0', attributes: [] }
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => schema,
    } as any)

    const result = await getSchemaById(mockAuth, 'schema-1')

    expect(result).toEqual(schema)
  })

  it('URL-encodes the schema ID in the request', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await getSchemaById(mockAuth, 'test/schema')

    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('test%2Fschema')
  })
})

describe('createSchema', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a new schema', async () => {
    const schemaData = {
      name: 'New Schema',
      version: '1.0',
      attributes: [{ name: 'attr1', type: 'string' as const }],
      did: 'did:example:123',
    }
    const response = { id: 'schema-1', ...schemaData }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => response,
    } as any)

    const result = await createSchema(mockAuth, schemaData)

    expect(result).toEqual(response)
  })

  it('sends POST request with schema data in body', async () => {
    const schemaData = {
      name: 'New Schema',
      version: '1.0',
      attributes: [{ name: 'attr1', type: 'string' as const }],
      did: 'did:example:123',
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await createSchema(mockAuth, schemaData)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify(schemaData),
    })
  })
})

describe('getAvailableDids', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches all available DIDs', async () => {
    const dids = [{ id: 'did-1', did: 'did:example:123' }]
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => dids,
    } as any)

    const result = await getAvailableDids(mockAuth)

    expect(result).toEqual(dids)
  })
})

describe('getAvailableImages', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetches images of a specific type', async () => {
    const images = ['/image1.png', '/image2.png']
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ files: images }),
    } as any)

    const result = await getAvailableImages(mockAuth, 'icon')

    expect(result).toEqual(images)
  })

  it('defaults to icon type when not specified', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    } as any)

    await getAvailableImages(mockAuth)

    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('type=icon')
  })

  it('includes image type in query parameters', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ files: [] }),
    } as any)

    await getAvailableImages(mockAuth, 'screen')

    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('type=screen')
  })
})

describe('updateCredential', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('updates a credential with the provided changes', async () => {
    const credentialId = 'cred-123'
    const updates = {
      attributes: [{ name: 'attr1', value: 'updated-value' }],
      icon: '/icons/new-icon.png',
    }
    const response = { id: credentialId, name: 'Test Credential', ...updates }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => response,
    } as any)

    const result = await updateCredential(mockAuth, credentialId, updates as any)

    expect(result).toEqual(response)
  })

  it('URL-encodes the credential ID in the request', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await updateCredential(mockAuth, 'cred/with/slashes', {})

    const url = vi.mocked(fetch).mock.calls[0][0] as string
    expect(url).toContain('cred%2Fwith%2Fslashes')
  })

  it('sends PUT request with authorization header', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await updateCredential(mockAuth, 'cred-123', { icon: '/icons/new.png' } as any)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]).toMatchObject({
      method: 'PUT',
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }),
    })
  })

  it('sends the updates in the request body', async () => {
    const updates = {
      attributes: [{ name: 'field1', value: 'value1' }],
      icon: '/icons/updated.png',
    }

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as any)

    await updateCredential(mockAuth, 'cred-123', updates as any)

    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[1]?.body).toBe(JSON.stringify(updates))
  })

  it('throws when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Credential not found' }),
    } as any)

    await expect(updateCredential(mockAuth, 'cred-123', {})).rejects.toThrow('Credential not found')
  })
})
