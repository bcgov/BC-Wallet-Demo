import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import { resolveMarker, resolveCredentialAttributes } from '../resolveMarkers'

describe('resolveMarker', () => {
  const FIXED_DATE = new Date('2025-06-15T00:00:00.000Z')

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_DATE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('resolves $dateint:0 to today as integer', () => {
    expect(resolveMarker('$dateint:0')).toBe(20250615)
  })

  it('resolves $dateint:4 to 4 years from today', () => {
    expect(resolveMarker('$dateint:4')).toBe(20290615)
  })

  it('resolves $dateint:-1 to 1 year ago', () => {
    expect(resolveMarker('$dateint:-1')).toBe(20240615)
  })

  it('resolves $dateint:-19 to 19 years ago', () => {
    expect(resolveMarker('$dateint:-19')).toBe(20060615)
  })

  it('passes through plain numbers unchanged', () => {
    expect(resolveMarker(42)).toBe(42)
  })

  it('passes through non-marker strings unchanged', () => {
    expect(resolveMarker('Alice')).toBe('Alice')
  })

  it('passes through empty string unchanged', () => {
    expect(resolveMarker('')).toBe('')
  })
})

describe('resolveCredentialAttributes', () => {
  const FIXED_DATE = new Date('2025-06-15T00:00:00.000Z')

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_DATE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('resolves $dateint markers in attribute values', () => {
    const attrs = [
      { name: 'expiry_date', value: '$dateint:4' },
      { name: 'given_names', value: 'Alice' },
    ]
    const result = resolveCredentialAttributes(attrs)
    expect(result).toEqual([
      { name: 'expiry_date', value: 20290615 },
      { name: 'given_names', value: 'Alice' },
    ])
  })

  it('leaves non-marker values untouched', () => {
    const attrs = [{ name: 'foo', value: 'bar' }]
    expect(resolveCredentialAttributes(attrs)).toEqual([{ name: 'foo', value: 'bar' }])
  })

  it('handles empty attribute list', () => {
    expect(resolveCredentialAttributes([])).toEqual([])
  })

  it('does not mutate the original array', () => {
    const attrs = [{ name: 'expiry_date', value: '$dateint:0' }]
    resolveCredentialAttributes(attrs)
    expect(attrs[0].value).toBe('$dateint:0')
  })
})
