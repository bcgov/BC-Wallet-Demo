import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'

import { getDateInt } from '../dateint'

describe('getDateInt', () => {
  const FIXED_DATE = new Date('2025-06-15T00:00:00.000Z')

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_DATE)
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  it('returns today as an integer with no offset', () => {
    expect(getDateInt()).toBe(20250615)
  })

  it('returns a past date integer with a negative offset', () => {
    expect(getDateInt(-1)).toBe(20240615)
  })

  it('returns a future date integer with a positive offset', () => {
    expect(getDateInt(1)).toBe(20260615)
  })

  it('returns an integer type', () => {
    expect(typeof getDateInt()).toBe('number')
    expect(Number.isInteger(getDateInt())).toBe(true)
  })
})
