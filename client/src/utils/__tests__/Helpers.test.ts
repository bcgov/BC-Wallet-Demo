import { describe, it, expect } from 'vitest'

import { isConnected, isCredIssued, isDataUrl } from '../Helpers'

describe('isConnected', () => {
  it('returns true for "complete"', () => {
    expect(isConnected('complete')).toBe(true)
  })

  it('returns true for "response"', () => {
    expect(isConnected('response')).toBe(true)
  })

  it('returns true for "active"', () => {
    expect(isConnected('active')).toBe(true)
  })

  it('returns false for "invited"', () => {
    expect(isConnected('invited')).toBe(false)
  })

  it('returns false for "init"', () => {
    expect(isConnected('init')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isConnected('')).toBe(false)
  })
})

describe('isCredIssued', () => {
  it('returns true for "credential_issued"', () => {
    expect(isCredIssued('credential_issued')).toBe(true)
  })

  it('returns true for "done"', () => {
    expect(isCredIssued('done')).toBe(true)
  })

  it('returns true for "credential_acked"', () => {
    expect(isCredIssued('credential_acked')).toBe(true)
  })

  it('returns false for "offer_sent"', () => {
    expect(isCredIssued('offer_sent')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isCredIssued('')).toBe(false)
  })
})

describe('isDataUrl', () => {
  it('returns true for a data URL', () => {
    expect(isDataUrl('data:image/png;base64,abc')).toBe(true)
  })

  it('returns false for a regular URL', () => {
    expect(isDataUrl('/public/icon.png')).toBe(false)
  })

  it('returns undefined for undefined', () => {
    expect(isDataUrl(undefined)).toBeUndefined()
  })

  it('returns an empty string for an empty string', () => {
    expect(isDataUrl('')).toBe('')
  })
})
