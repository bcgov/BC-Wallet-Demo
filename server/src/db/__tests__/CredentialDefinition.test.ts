import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { CredentialDefinitionModel } from '../models/CredentialDefinition'

let mongod: MongoMemoryServer

const minimal = { name: 'Student Card', version: '1.0', did_method: 'indy' as const }

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  // Ensure compound unique index is created before tests run.
  await CredentialDefinitionModel.ensureIndexes()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('CredentialDefinitionModel', () => {
  it('persists a credential definition with status defaulting to active', async () => {
    const doc = await CredentialDefinitionModel.create(minimal)
    const json = doc.toJSON()
    expect(json.name).toBe('Student Card')
    expect(json.did_method).toBe('indy')
    expect(json.status).toBe('active')
  })

  it('rejects an invalid did_method', async () => {
    await expect(CredentialDefinitionModel.create({ name: 'X', version: '1.0', did_method: 'cheqd' })).rejects.toThrow()
  })

  it('rejects an invalid status', async () => {
    await expect(CredentialDefinitionModel.create({ ...minimal, version: '1.1', status: 'pending' })).rejects.toThrow()
  })
})

describe('CredentialDefinitionModel: compound unique index (name, version, did_method)', () => {
  it('allows the same name+version under different did_methods', async () => {
    await CredentialDefinitionModel.create({ name: 'Driver Licence', version: '1.0', did_method: 'indy' })
    const doc = await CredentialDefinitionModel.create({ name: 'Driver Licence', version: '1.0', did_method: 'webvh' })
    expect(doc.toJSON().did_method).toBe('webvh')
  })

  it('rejects a duplicate (name, version, did_method) triplet', async () => {
    await CredentialDefinitionModel.create({ name: 'Member Card', version: '1.0', did_method: 'indy' })
    await expect(
      CredentialDefinitionModel.create({ name: 'Member Card', version: '1.0', did_method: 'indy' })
    ).rejects.toThrow()
  })
})

describe('CredentialDefinitionModel: optional fields', () => {
  it('persists schema_id and cred_def_id after ledger registration', async () => {
    const doc = await CredentialDefinitionModel.create({
      ...minimal,
      version: '2.0',
      schema_id: 'QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6',
      cred_def_id: 'QEquAHkM35w4XVT3Ku5yat:3:CL:1234:default',
    })
    const json = doc.toJSON()
    expect(json.schema_id).toBe('QEquAHkM35w4XVT3Ku5yat:2:student_card:1.6')
    expect(json.cred_def_id).toBe('QEquAHkM35w4XVT3Ku5yat:3:CL:1234:default')
  })

  it('persists attributes', async () => {
    const doc = await CredentialDefinitionModel.create({
      ...minimal,
      version: '2.1',
      attributes: [
        { name: 'student_id', value: '' },
        { name: 'given_names', value: '' },
      ],
    })
    const attrs = doc.toJSON().attributes
    expect(attrs).toHaveLength(2)
    expect(attrs[0].name).toBe('student_id')
  })
})
