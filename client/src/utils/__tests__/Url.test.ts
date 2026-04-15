import { describe, it, expect, vi } from 'vitest'

vi.mock('../../api/BaseUrl', () => ({
  baseUrl: 'http://test-backend/digital-trust/showcase',
}))

import { prependApiUrl } from '../Url'

describe('prependApiUrl', () => {
  it('prepends the base URL to a relative path', () => {
    expect(prependApiUrl('/images/icon.png')).toBe('http://test-backend/digital-trust/showcase/images/icon.png')
  })

  it('returns a data URL unchanged', () => {
    const dataUrl = 'data:image/png;base64,abc123'
    expect(prependApiUrl(dataUrl)).toBe(dataUrl)
  })

  it('handles an empty path', () => {
    expect(prependApiUrl('')).toBe('http://test-backend/digital-trust/showcase')
  })
})
