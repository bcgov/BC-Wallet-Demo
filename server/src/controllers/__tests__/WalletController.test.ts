import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

import { WalletController } from '../WalletController'

describe('WalletController', () => {
  let controller: WalletController

  beforeEach(() => {
    controller = new WalletController()
  })

  describe('getAll', () => {
    it('returns an array of wallets', async () => {
      const result = await controller.getAll()

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('returns wallets with the expected shape', async () => {
      const result = await controller.getAll()
      const wallet = result[0]

      expect(wallet).toHaveProperty('id')
      expect(wallet).toHaveProperty('name')
      expect(wallet).toHaveProperty('url')
    })

    it('includes the BC Wallet entry', async () => {
      const result = await controller.getAll()

      expect(result.some((w) => w.name === 'BC Wallet')).toBe(true)
    })
  })
})
