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

import * as th from '../tractionHelper'

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
      })
    )
  })

  it('get: passes additional config options through', async () => {
    vi.mocked(axios.get).mockResolvedValue({ data: {} })

    await th.tractionRequest.get('/connections', { params: { state: 'active' } })

    expect(axios.get).toHaveBeenCalledWith(
      'https://traction.example.com/connections',
      expect.objectContaining({ params: { state: 'active' } })
    )
  })

  it('post: calls axios.post with composed URL, body, bearer auth, and timeout', async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: {} })
    const body = { foo: 'bar' }

    await th.tractionRequest.post('/issue-credential/send', body)

    expect(axios.post).toHaveBeenCalledWith(
      'https://traction.example.com/issue-credential/send',
      body,
      expect.objectContaining({
        timeout: 80000,
        headers: expect.objectContaining({ Authorization: expect.stringContaining('Bearer') }),
      })
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
      })
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
    process.env.TENANT_ID = 'tenant123'
    process.env.API_KEY = 'apikey456'
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.TRACTION_URL
    delete process.env.TENANT_ID
    delete process.env.API_KEY
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
      expect.anything()
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
          results: [{ credential_exchange_id: 'cred-exch-1', created_at: staleDate }],
        },
      })
      .mockResolvedValueOnce({ data: { results: [] } })
    vi.mocked(axios.delete).mockResolvedValue({ data: {} })

    await th.tractionGarbageCollection()
    for (let i = 0; i < 10; i++) await Promise.resolve()

    expect(axios.delete).toHaveBeenCalledWith(
      'https://traction.example.com/issue-credential/records/cred-exch-1',
      expect.anything()
    )
  })
})
