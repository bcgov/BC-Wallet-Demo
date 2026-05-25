import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/tractionHelper', () => ({
  tractionRequest: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock('../../services/oobInvitationShortLink', () => ({
  attachShortUrlToOobInvite: vi.fn(),
}))

import { attachShortUrlToOobInvite } from '../../services/oobInvitationShortLink'
import { tractionRequest } from '../../utils/tractionHelper'
import { ConnectionController } from '../ConnectionController'

describe('ConnectionController', () => {
  let controller: ConnectionController

  beforeEach(() => {
    controller = new ConnectionController()
    vi.clearAllMocks()
    process.env.BASE_ROUTE = '/digital-trust/showcase'
    process.env.SHOWCASE_PUBLIC_ORIGIN = 'https://showcase.example.com'
  })

  describe('getConnectionStatus', () => {
    it('calls tractionRequest.get with the correct endpoint', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'active', connection_id: 'conn1' } })

      await controller.getConnectionStatus('conn1')

      expect(tractionRequest.get).toHaveBeenCalledWith('/connections/conn1')
    })

    it('returns the response data', async () => {
      const mockData = { state: 'active', connection_id: 'conn1' }
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: mockData })

      const result = await controller.getConnectionStatus('conn1')

      expect(result).toEqual(mockData)
    })
  })

  describe('getConnectionByInvitation', () => {
    it('calls tractionRequest.get with the invitation message id as a query param', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [{ connection_id: 'conn1' }] } })

      await controller.getConnectionByInvitation('invite-123')

      expect(tractionRequest.get).toHaveBeenCalledWith('/connections?invitation_msg_id=invite-123')
    })

    it('returns the first result from the response', async () => {
      const first = { connection_id: 'conn1' }
      const second = { connection_id: 'conn2' }
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [first, second] } })

      const result = await controller.getConnectionByInvitation('invite-123')

      expect(result).toEqual(first)
    })

    it('returns undefined when results array is empty', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { results: [] } })

      const result = await controller.getConnectionByInvitation('invite-abc')

      expect(result).toBeUndefined()
    })
  })

  describe('createConnectionInvite', () => {
    it('posts to the OOB create-invitation endpoint', async () => {
      vi.mocked(tractionRequest.post).mockResolvedValue({
        data: { invitation_url: 'https://example.com/invite' },
      })

      await controller.createConnectionInvite({}, { headers: {} } as any)

      expect(tractionRequest.post).toHaveBeenCalledWith(
        '/out-of-band/create-invitation?multi_use=false',
        expect.objectContaining({
          accept: expect.arrayContaining(['didcomm/aip1']),
          handshake_protocols: expect.arrayContaining(['https://didcomm.org/didexchange/1.0']),
          use_public_did: false,
        }),
      )
    })

    it('merges caller-supplied params into the invitation body', async () => {
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: {} })

      await controller.createConnectionInvite({ my_label: 'Test Label' }, { headers: {} } as any)

      expect(tractionRequest.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ my_label: 'Test Label' }),
      )
    })

    it('returns the response data', async () => {
      const mockData = { invitation_url: 'https://example.com/invite', connection_id: 'conn1' }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })

      const result = await controller.createConnectionInvite({}, { headers: {} } as any)

      expect(result).toEqual(mockData)
    })

    it('persists OOB invitation and adds short_url when invitation has @id', async () => {
      const invitation = {
        '@type': 'https://didcomm.org/out-of-band/1.1/invitation',
        '@id': 'oob-uuid-123',
      }
      const mockData = {
        invitation_url: 'https://traction.example/?c_i=abc',
        invitation,
        invi_msg_id: 'msg-1',
        connection_id: 'conn1',
      }
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: mockData })
      vi.mocked(attachShortUrlToOobInvite).mockResolvedValue(
        'https://showcase.example.com/digital-trust/showcase/i/oob-uuid-123',
      )

      const result = await controller.createConnectionInvite({}, { headers: {} } as any)

      expect(attachShortUrlToOobInvite).toHaveBeenCalledWith(
        expect.objectContaining({ invitation, invi_msg_id: 'msg-1' }),
        expect.anything(),
        'connection',
      )
      expect(result.short_url).toBe('https://showcase.example.com/digital-trust/showcase/i/oob-uuid-123')
      expect(result.invitation_url).toBe('https://traction.example/?c_i=abc')
    })
  })
})
