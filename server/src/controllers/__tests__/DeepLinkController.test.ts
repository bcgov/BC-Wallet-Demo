import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

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

import { tractionRequest } from '../../utils/tractionHelper'
import { DeeplinkController } from '../DeepLinkController'

describe('DeeplinkController', () => {
  let controller: DeeplinkController

  beforeEach(() => {
    controller = new DeeplinkController()
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('offerCredential', () => {
    it('posts credential when connection becomes active', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'complete' } })
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { credential_exchange_id: 'cred1' } })

      const promise = controller.offerCredential({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toEqual({ credential_exchange_id: 'cred1' })
      expect(tractionRequest.post).toHaveBeenCalledWith('/issue-credential/send', { connection_id: 'conn1' })
    })

    it('accepts "response" as a connected state', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'response' } })
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { credential_exchange_id: 'cred1' } })

      const promise = controller.offerCredential({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeDefined()
    })

    it('returns undefined when connection never reaches active state', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'init' } })

      const promise = controller.offerCredential({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeUndefined()
      expect(tractionRequest.post).not.toHaveBeenCalled()
    })

    it('returns undefined when connection polling throws', async () => {
      vi.mocked(tractionRequest.get).mockRejectedValue(new Error('Network error'))

      const promise = controller.offerCredential({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeUndefined()
    })
  })

  describe('requestProof', () => {
    it('sends proof request when connection becomes active', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'active' } })
      vi.mocked(tractionRequest.post).mockResolvedValue({ data: { presentation_exchange_id: 'pex1' } })

      const promise = controller.requestProof({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toEqual({ presentation_exchange_id: 'pex1' })
      expect(tractionRequest.post).toHaveBeenCalledWith('/present-proof/send-request', { connection_id: 'conn1' })
    })

    it('returns undefined when connection never becomes active', async () => {
      vi.mocked(tractionRequest.get).mockResolvedValue({ data: { state: 'abandoned' } })

      const promise = controller.requestProof({ connection_id: 'conn1' })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBeUndefined()
      expect(tractionRequest.post).not.toHaveBeenCalled()
    })
  })
})
