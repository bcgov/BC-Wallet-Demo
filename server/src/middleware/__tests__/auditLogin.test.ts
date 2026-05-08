import type { NextFunction, Request, Response } from 'express'

import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('../../utils/logger', () => ({
  default: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

const { mocks } = vi.hoisted(() => {
  return {
    mocks: {
      mockAuditLogService: {
        log: vi.fn().mockResolvedValue(undefined),
      },
    },
  }
})

vi.mock('typedi', () => ({
  Container: {
    get: () => mocks.mockAuditLogService,
  },
  Service: () => (target: any) => target,
}))

import { auditLoginMiddleware } from '../auditLogin'

function makeReq(auth?: Record<string, unknown>): Request {
  return { auth } as unknown as Request
}

const res = {} as Response
const next = vi.fn() as unknown as NextFunction

describe('auditLoginMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the internal Map between tests by re-importing won't work easily,
    // so we rely on unique user IDs per test to avoid state leakage.
  })

  it('calls next() regardless', () => {
    auditLoginMiddleware(makeReq({ sub: 'user-next-test' }), res, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('logs a login event on first request from a user', async () => {
    auditLoginMiddleware(makeReq({ sub: 'user-first', preferred_username: 'alice' }), res, next)

    // Allow microtasks to flush
    await new Promise((r) => setImmediate(r))

    expect(mocks.mockAuditLogService.log).toHaveBeenCalledOnce()
    expect(mocks.mockAuditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-first',
        action: 'login',
        resource_type: 'user',
        details: { username: 'alice' },
      }),
    )
  })

  it('does not log again within 30-minute window', async () => {
    auditLoginMiddleware(makeReq({ sub: 'user-window' }), res, next)
    auditLoginMiddleware(makeReq({ sub: 'user-window' }), res, next)

    await new Promise((r) => setImmediate(r))

    expect(mocks.mockAuditLogService.log).toHaveBeenCalledOnce()
  })

  it('logs again after the window expires', async () => {
    const userId = 'user-expired'

    auditLoginMiddleware(makeReq({ sub: userId }), res, next)
    await new Promise((r) => setImmediate(r))

    // Simulate window expiry by directly manipulating time via fake timer
    vi.useFakeTimers()
    vi.advanceTimersByTime(31 * 60 * 1000) // 31 minutes

    auditLoginMiddleware(makeReq({ sub: userId }), res, next)
    vi.useRealTimers()

    await new Promise((r) => setImmediate(r))

    expect(mocks.mockAuditLogService.log).toHaveBeenCalledTimes(2)
  })

  it('does nothing when req.auth is undefined', async () => {
    auditLoginMiddleware(makeReq(undefined), res, next)

    await new Promise((r) => setImmediate(r))

    expect(mocks.mockAuditLogService.log).not.toHaveBeenCalled()
    expect(next).toHaveBeenCalledOnce()
  })

  it('does nothing when req.auth.sub is missing', async () => {
    auditLoginMiddleware(makeReq({ preferred_username: 'alice' }), res, next)

    await new Promise((r) => setImmediate(r))

    expect(mocks.mockAuditLogService.log).not.toHaveBeenCalled()
  })

  it('calls next even when audit log write fails', async () => {
    mocks.mockAuditLogService.log.mockRejectedValueOnce(new Error('DB down'))

    auditLoginMiddleware(makeReq({ sub: 'user-fail' }), res, next)

    await new Promise((r) => setImmediate(r))

    expect(next).toHaveBeenCalledOnce()
  })
})
