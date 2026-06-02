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
  it('saves and reads schema_id and cred_def_ids', async () => {
    const doc = await CredentialModel.create({
      _id: 'traction-card',
      name: 'Traction Card',
      icon: '/icon.svg',
      version: '1.0',
      attributes: [{ name: 'field', value: 'placeholder' }],
      schema_id: 'ABC:2:traction_card:1.0',
      cred_def_id: 'ABC:3:CL:100:tag',
    })

    const json = doc.toJSON()
    expect(json.schema_id).toBe('ABC:2:traction_card:1.0')
    expect(json.cred_def_id).toBe('ABC:3:CL:100:tag')
  })

  it('defaults status to active when not set', async () => {
    const doc = await CredentialModel.create({
      _id: 'status-card',
      name: 'Status Card',
      icon: '/icon.svg',
      version: '1.0',
      attributes: [],
    })

    const json = doc.toJSON()
    expect(json.status).toBe('active')
  })

  it('saves status retired correctly', async () => {
    const doc = await CredentialModel.create({
      _id: 'retired-card',
      name: 'Retired Card',
      icon: '/icon.svg',
      version: '1.0',
      attributes: [],
      status: 'retired',
    })

    const json = doc.toJSON()
    expect(json.status).toBe('retired')
  })

  it('existing credentials without new fields still work', async () => {
    const doc = await CredentialModel.create({
      _id: 'legacy-card',
      name: 'Legacy Card',
      icon: '/icon.svg',
      version: '1.0',
      attributes: [{ name: 'field', value: 'val' }],
    })

    const json = doc.toJSON()
    expect(json.id).toBe('legacy-card')
    expect(json.schema_id).toBeUndefined()
    expect(json.cred_def_id).toBeUndefined()
    expect(json.status).toBe('active')
  })

  it('persists a credential with auto-generated UUID', async () => {
    const doc = await CredentialModel.create({
      name: 'Student Card',
      icon: '/icon.svg',
      version: '1.0.0',
      attributes: [{ name: 'student_id', value: '12345' }],
    })

    const json = doc.toJSON()
    expect(json.id).toBeDefined()
    expect(typeof json.id).toBe('string')
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
