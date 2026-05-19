import { describe, expect, it } from 'vitest'

import { buildShortInvitationUrl, getOobInvitationId, isShortInvitationUrlEnabled } from '../oobInvitation'

describe('isShortInvitationUrlEnabled', () => {
  const original = process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
    } else {
      process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = original
    }
  })

  it('defaults to true when unset', () => {
    delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
    expect(isShortInvitationUrlEnabled()).toBe(true)
  })

  it('returns false for common false strings', () => {
    for (const value of ['false', '0', 'no', 'off', 'FALSE']) {
      process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = value
      expect(isShortInvitationUrlEnabled()).toBe(false)
    }
  })

  it('returns true for other explicit values', () => {
    process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = 'true'
    expect(isShortInvitationUrlEnabled()).toBe(true)
  })
})

describe('getOobInvitationId', () => {
  it('returns @id from the OOB invitation', () => {
    expect(
      getOobInvitationId({
        '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
        '@id': 'a1532175-8a57-46bf-9cb2-17db90cae0e0',
      }),
    ).toBe('a1532175-8a57-46bf-9cb2-17db90cae0e0')
  })

  it('strips urn:uuid: prefix', () => {
    expect(
      getOobInvitationId({
        '@id': 'urn:uuid:11111111-2222-3333-4444-555555555555',
      }),
    ).toBe('11111111-2222-3333-4444-555555555555')
  })

  it('returns undefined when @id is missing', () => {
    expect(getOobInvitationId({ '@type': 'https://didcomm.org/out-of-band/1.1/invitation' })).toBeUndefined()
  })
})

describe('buildShortInvitationUrl', () => {
  it('builds a public short URL under baseRoute', () => {
    expect(
      buildShortInvitationUrl('oob-123', 'https://showcase.example.com', '/digital-trust/showcase'),
    ).toBe('https://showcase.example.com/digital-trust/showcase/i/oob-123')
  })

  it('encodes special characters in the oob id', () => {
    expect(buildShortInvitationUrl('id/with space', 'https://host', '/base')).toBe(
      'https://host/base/i/id%2Fwith%20space',
    )
  })
})
