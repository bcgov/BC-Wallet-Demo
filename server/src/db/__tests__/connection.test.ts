import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { connectDB, registerShutdownHandlers } from '../connection'

// --- connectDB — happy path ---------------------------------------------------

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  vi.stubEnv('MONGODB_URI', mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
  vi.unstubAllEnvs()
})

describe('connectDB', () => {
  it('connects and sets readyState to 1', async () => {
    await connectDB()
    expect(mongoose.connection.readyState).toBe(1)
  })
})

// --- connectDB — retry logic --------------------------------------------------

describe('connectDB retry behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('resolves immediately on first successful connect', async () => {
    vi.spyOn(mongoose, 'connect').mockResolvedValueOnce(mongoose)
    await expect(connectDB()).resolves.toBeUndefined()
    expect(mongoose.connect).toHaveBeenCalledTimes(1)
    expect(mongoose.connect).toHaveBeenCalledWith(expect.any(String), { serverSelectionTimeoutMS: 3000 })
  })

  it('retries after a failed attempt and resolves on second', async () => {
    vi.spyOn(mongoose, 'connect').mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce(mongoose)

    // attach .rejects/.resolves before advancing timers to avoid unhandled rejection warnings
    const connectPromise = connectDB()
    await vi.runAllTimersAsync()
    await expect(connectPromise).resolves.toBeUndefined()
    expect(mongoose.connect).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting all attempts', async () => {
    vi.spyOn(mongoose, 'connect').mockRejectedValue(new Error('ECONNREFUSED'))

    // attach .rejects immediately so the rejection is never unhandled
    const assertion = expect(connectDB()).rejects.toThrow('ECONNREFUSED')
    await vi.runAllTimersAsync()
    await assertion
    expect(mongoose.connect).toHaveBeenCalledTimes(3)
  })
})

// --- registerShutdownHandlers ─────────────────────────────────────────────────

describe('registerShutdownHandlers', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers handlers for SIGTERM and SIGINT', () => {
    const once = vi.fn()
    registerShutdownHandlers(vi.fn(), once)
    expect(once).toHaveBeenCalledWith('SIGTERM', expect.any(Function))
    expect(once).toHaveBeenCalledWith('SIGINT', expect.any(Function))
  })

  it('calls disconnectFn when SIGTERM fires', async () => {
    const handlers: Record<string, () => void> = {}
    const once = vi.fn((signal: string, handler: () => void) => {
      handlers[signal] = handler
    })
    const disconnectFn = vi.fn().mockResolvedValue(undefined)

    registerShutdownHandlers(disconnectFn, once)
    handlers['SIGTERM']()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(disconnectFn).toHaveBeenCalledOnce()
  })

  it('calls disconnectFn when SIGINT fires', async () => {
    const handlers: Record<string, () => void> = {}
    const once = vi.fn((signal: string, handler: () => void) => {
      handlers[signal] = handler
    })
    const disconnectFn = vi.fn().mockResolvedValue(undefined)

    registerShutdownHandlers(disconnectFn, once)
    handlers['SIGINT']()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(disconnectFn).toHaveBeenCalledOnce()
  })
})
