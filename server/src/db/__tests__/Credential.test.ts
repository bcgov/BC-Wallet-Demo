import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { CredentialModel } from '../models/Credential'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await CredentialModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('CredentialModel', () => {
  it('persists a credential with a string id', async () => {
    const doc = await CredentialModel.create({
      _id: 'student-card',
      name: 'Student Card',
      icon: '/icon.svg',
      version: '1.0.0',
      attributes: [{ name: 'student_id', value: '12345' }],
    })

    const json = doc.toJSON()
    expect(json.id).toBe('student-card')
    expect(json.attributes[0].name).toBe('student_id')
    expect(json.attributes[0].value).toBe('12345')
  })

  it('requires mandatory fields', async () => {
    await expect(
      CredentialModel.create({
        _id: 'missing-fields',
        // name missing
        icon: '/icon.svg',
        version: '1.0.0',
        attributes: [],
      }),
    ).rejects.toThrow()
  })

  it('allows updating an existing credential', async () => {
    await CredentialModel.create({
      _id: 'student-card',
      name: 'Student Card',
      icon: '/icon.svg',
      version: '1.0.0',
      attributes: [],
    })

    const updated = await CredentialModel.findOneAndUpdate(
      { _id: 'student-card' },
      { $set: { version: '1.1.0' } },
      { new: true },
    )

    expect(updated?.version).toBe('1.1.0')
  })
})
