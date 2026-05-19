import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getAllCredentials } from '../adminApi'

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
    } as any)

    await expect(getAllCredentials(mockAuth)).rejects.toThrow('Request failed: 500')
  })
})
