import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { connectDB } from '../connection'

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
  it('connects to MongoDB and sets readyState to connected', async () => {
    await connectDB()
    expect(mongoose.connection.readyState).toBe(1)
  })
})
