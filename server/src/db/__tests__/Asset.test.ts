import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AssetModel } from '../models/Asset'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await AssetModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('AssetModel', () => {
  it('persists an asset with all required fields', async () => {
    const doc = await AssetModel.create({
      filename: 'logo.png',
      mime_type: 'image/png',
      size_bytes: 4096,
    })
    const json = doc.toJSON()
    expect(json.filename).toBe('logo.png')
    expect(json.mime_type).toBe('image/png')
    expect(json.size_bytes).toBe(4096)
  })

  it('persists optional type field', async () => {
    const doc = await AssetModel.create({
      filename: 'icon.svg',
      mime_type: 'image/svg+xml',
      size_bytes: 512,
      type: 'icon',
    })
    expect(doc.toJSON().type).toBe('icon')
  })

  it('allows missing type field', async () => {
    const doc = await AssetModel.create({
      filename: 'img.png',
      mime_type: 'image/png',
      size_bytes: 100,
    })
    expect(doc.type).toBeUndefined()
  })

  it('rejects an asset missing a required field', async () => {
    await expect(AssetModel.create({ filename: 'x.png', mime_type: 'image/png' })).rejects.toThrow()
  })

  it('exposes createdAt timestamp', async () => {
    const doc = await AssetModel.create({
      filename: 'ts.png',
      mime_type: 'image/png',
      size_bytes: 256,
    })
    const json = doc.toJSON() as unknown as Record<string, unknown>
    expect(json['createdAt']).toBeDefined()
  })
})
