import { UnauthorizedError } from 'routing-controllers'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { WebhookController } from '../WebhookController'

const makeReq = (overrides: Record<string, any> = {}) => ({
  headers: { 'x-api-key': 'correct-secret' },
  app: { get: vi.fn().mockReturnValue(new Map()) },
  path: '/whook/topic/connections',
  ...overrides,
})

describe('WebhookController', () => {
  let controller: WebhookController

  beforeEach(() => {
    controller = new WebhookController()
    process.env.WEBHOOK_SECRET = 'correct-secret'
  })

  afterEach(() => {
    delete process.env.WEBHOOK_SECRET
  })

  describe('handlePostWhook', () => {
    it('throws UnauthorizedError when x-api-key does not match WEBHOOK_SECRET', async () => {
      const req = makeReq({ headers: { 'x-api-key': 'wrong-key' } })

      await expect(controller.handlePostWhook({}, req)).rejects.toThrow(UnauthorizedError)
    })

    it('returns a success message when the API key is correct', async () => {
      const req = makeReq()

      const result = await controller.handlePostWhook({ connection_id: 'conn1' }, req)

      expect(result).toEqual({ message: 'Webhook received' })
    })

    it('emits a socket message when a socket exists for the connectionId', async () => {
      const mockEmit = vi.fn()
      const socketMap = new Map([['conn1', { emit: mockEmit }]])
      const req = makeReq({ app: { get: vi.fn().mockReturnValue(socketMap) } })
      const params = { connection_id: 'conn1', state: 'active' }

      await controller.handlePostWhook(params, req)

      expect(mockEmit).toHaveBeenCalledWith(
        'message',
        expect.objectContaining({ connection_id: 'conn1', endpoint: 'connections' }),
      )
    })

    it('does not throw when no socket exists for the connectionId', async () => {
      const req = makeReq({ app: { get: vi.fn().mockReturnValue(new Map()) } })

      await expect(controller.handlePostWhook({ connection_id: 'nobody' }, req)).resolves.toEqual({
        message: 'Webhook received',
      })
    })

    it('strips trailing slash from path when extracting endpoint', async () => {
      const mockEmit = vi.fn()
      const socketMap = new Map([['conn1', { emit: mockEmit }]])
      const req = makeReq({
        path: '/whook/topic/connections/',
        app: { get: vi.fn().mockReturnValue(socketMap) },
      })

      await controller.handlePostWhook({ connection_id: 'conn1' }, req)

      expect(mockEmit).toHaveBeenCalledWith('message', expect.objectContaining({ endpoint: 'connections' }))
    })

    it('sets the endpoint field on the params object', async () => {
      const mockEmit = vi.fn()
      const socketMap = new Map([['conn1', { emit: mockEmit }]])
      const req = makeReq({
        path: '/topic/basicmessages',
        app: { get: vi.fn().mockReturnValue(socketMap) },
      })

      await controller.handlePostWhook({ connection_id: 'conn1' }, req)

      expect(mockEmit).toHaveBeenCalledWith('message', expect.objectContaining({ endpoint: 'basicmessages' }))
    })
  })
})
