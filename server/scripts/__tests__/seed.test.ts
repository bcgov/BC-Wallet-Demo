import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { ShowcaseModel } from '../../src/db/models/Showcase'
import showcases from '../../src/content/Showcases'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await ShowcaseModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('runSeed', () => {
  it('inserts all showcases on first run', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    const count = await ShowcaseModel.countDocuments()
    expect(count).toBe(showcases.length)
  })

  it('is idempotent: running twice leaves the same document count', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    await runSeed()
    const count = await ShowcaseModel.countDocuments()
    expect(count).toBe(showcases.length)
  })

  it('upserts updated fields when config changes', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()

    await ShowcaseModel.findOneAndUpdate(
      { 'persona.type': showcases[0].persona.type },
      { $set: { name: 'Modified Name' } },
    )

    await runSeed()

    const doc = await ShowcaseModel.findOne({ 'persona.type': showcases[0].persona.type })
    expect(doc?.name).toBe(showcases[0].name)
  })

  it('each showcase has the expected persona type', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    const types = (await ShowcaseModel.find().select('persona.type')).map((d) => d.persona.type)
    expect(types).toEqual(expect.arrayContaining(showcases.map((s) => s.persona.type)))
  })
})
