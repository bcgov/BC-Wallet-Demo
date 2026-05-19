import type { Request } from 'express'

import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../oobInvitationStore', () => ({
  persistOobInvitation: vi.fn(),
}))

vi.mock('../../utils/publicOrigin', () => ({
  resolvePublicOrigin: vi.fn(() => 'https://showcase.example.com'),
}))

import { attachShortUrlToOobInvite } from '../oobInvitationShortLink'
import { persistOobInvitation } from '../oobInvitationStore'

describe('attachShortUrlToOobInvite', () => {
  const originalFlag = process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.BASE_ROUTE = '/digital-trust/showcase'
    delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
  })

  afterEach(() => {
    if (originalFlag === undefined) {
      delete process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED
    } else {
      process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = originalFlag
    }
  })

  it('persists proof invitation and returns short URL', async () => {
    const payload = {
      invitation: { '@id': 'proof-oob-id' },
      invitation_url: 'https://traction.example/invite',
      invi_msg_id: 'msg-2',
    }

    const url = await attachShortUrlToOobInvite(payload, { headers: {} } as Request, 'proof')

    expect(persistOobInvitation).toHaveBeenCalledWith({
      oobId: 'proof-oob-id',
      invitation: payload.invitation,
      inviMsgId: 'msg-2',
      kind: 'proof',
    })
    expect(url).toBe('https://showcase.example.com/digital-trust/showcase/i/proof-oob-id')
  })

  it('returns undefined when invitation has no @id', async () => {
    const url = await attachShortUrlToOobInvite({ invitation: {} }, { headers: {} } as Request, 'proof')
    expect(url).toBeUndefined()
    expect(persistOobInvitation).not.toHaveBeenCalled()
  })

  it('returns undefined when short invitation URLs are disabled', async () => {
    process.env.SHOWCASE_SHORT_INVITATION_URLS_ENABLED = 'false'
    const url = await attachShortUrlToOobInvite(
      { invitation: { '@id': 'proof-oob-id' } },
      { headers: {} } as Request,
      'proof',
    )
    expect(url).toBeUndefined()
    expect(persistOobInvitation).not.toHaveBeenCalled()
  })
})
