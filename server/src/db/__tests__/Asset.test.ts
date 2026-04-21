import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AssetModel } from '../models/Asset'
import { CharacterModel } from '../models/Character'

let mongod: MongoMemoryServer

const minimalCharacter = { name: 'Alice', type: 'AssetTestChar', image: '/public/student/student.svg' }

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

// Clear between tests so documents from one test cannot affect another.
afterEach(async () => {
  await AssetModel.deleteMany({})
  await CharacterModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('AssetModel', () => {
  it('persists an asset with all required fields', async () => {
    const character = await CharacterModel.create(minimalCharacter)
    const doc = await AssetModel.create({
      showcase_id: character._id,
      filename: 'logo.png',
      path: '/uploads/logo.png',
      mime_type: 'image/png',
      size_bytes: 4096,
    })
    const json = doc.toJSON()
    expect(json.filename).toBe('logo.png')
    expect(json.mime_type).toBe('image/png')
    expect(json.size_bytes).toBe(4096)
    expect(json.showcase_id).toEqual(character._id)
  })

  it('rejects an asset missing a required field', async () => {
    const character = await CharacterModel.create({ ...minimalCharacter, type: 'AssetTestChar2' })
    await expect(
      AssetModel.create({ showcase_id: character._id, filename: 'x.png', mime_type: 'image/png' }),
    ).rejects.toThrow()
  })

  it('exposes createdAt timestamp', async () => {
    const character = await CharacterModel.create({ ...minimalCharacter, type: 'AssetTestChar3' })
    const doc = await AssetModel.create({
      showcase_id: character._id,
      filename: 'icon.svg',
      path: '/uploads/icon.svg',
      mime_type: 'image/svg+xml',
      size_bytes: 512,
    })
    expect(doc.toJSON().createdAt).toBeDefined()
  })
})

describe('Asset cascade deletion', () => {
  it('deletes asset documents when the owning character is deleted', async () => {
    const character = await CharacterModel.create({ ...minimalCharacter, type: 'CascadeChar' })
    await AssetModel.create({
      showcase_id: character._id,
      filename: 'a.png',
      path: '/uploads/a.png',
      mime_type: 'image/png',
      size_bytes: 1024,
    })

    await CharacterModel.findByIdAndDelete(character._id)

    const remaining = await AssetModel.find({ showcase_id: character._id })
    expect(remaining).toHaveLength(0)
  })

  it('deletes files from disk when the owning character is deleted', async () => {
    // Write a real temp file so we can verify it gets removed.
    const tmpFile = path.join(os.tmpdir(), `asset-cascade-test-${Date.now()}.png`)
    await fs.writeFile(tmpFile, 'fake image data')

    const character = await CharacterModel.create({ ...minimalCharacter, type: 'CascadeCharDisk' })
    await AssetModel.create({
      showcase_id: character._id,
      filename: 'tmp.png',
      path: tmpFile,
      mime_type: 'image/png',
      size_bytes: 16,
    })

    await CharacterModel.findByIdAndDelete(character._id)

    await expect(fs.access(tmpFile)).rejects.toThrow()
  })
})
