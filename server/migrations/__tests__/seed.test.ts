import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import showcases, { allCredentials } from '../../src/content/Showcases'
import { CredentialModel } from '../../src/db/models/Credential'
import { ShowcaseModel } from '../../src/db/models/Showcase'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await CredentialModel.deleteMany({})
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

  it('inserts all credentials on first run', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    const count = await CredentialModel.countDocuments()
    expect(count).toBe(allCredentials.length)
  })

  it('is idempotent: running twice leaves the same document count', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    await runSeed()
    const showcaseCount = await ShowcaseModel.countDocuments()
    const credCount = await CredentialModel.countDocuments()
    expect(showcaseCount).toBe(showcases.length)
    expect(credCount).toBe(allCredentials.length)
  })

  it('upserts updated fields when config changes', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()

    await ShowcaseModel.findOneAndUpdate(
      { 'persona.type': showcases[0].persona?.type },
      { $set: { name: 'Modified Name' } },
    )

    await runSeed()

    const doc = await ShowcaseModel.findOne({ 'persona.type': showcases[0].persona?.type })
    expect(doc?.name).toBe(showcases[0].name)
  })

  it('each showcase has the expected persona type', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    const types = (await ShowcaseModel.find().select('persona.type')).map((d) => d.persona?.type)
    expect(types).toEqual(expect.arrayContaining(showcases.map((s) => s.persona?.type)))
  })

  it('showcase credentials field contains ID strings not objects', async () => {
    const { runSeed } = await import('../seed')
    await runSeed()
    const doc = await ShowcaseModel.findOne({ 'persona.type': showcases[0].persona?.type }).lean()
    expect(doc?.credentials.every((c) => typeof c === 'string')).toBe(true)
  })
})
