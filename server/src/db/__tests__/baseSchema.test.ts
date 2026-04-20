import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose, { Schema, model } from 'mongoose'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { baseSchemaOptions, embeddedSchemaOptions } from '../baseSchema'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('baseSchemaOptions', () => {
  const TopSchema = new Schema({ name: String }, baseSchemaOptions)
  const TopModel = model('Top', TopSchema)

  it('adds createdAt and updatedAt timestamps', async () => {
    const doc = await TopModel.create({ name: 'test' })
    expect(doc.createdAt).toBeInstanceOf(Date)
    expect(doc.updatedAt).toBeInstanceOf(Date)
  })

  it('removes _id and __v from JSON output and exposes id', async () => {
    const doc = await TopModel.create({ name: 'test' })
    const json = doc.toJSON()
    expect(json.id).toBeDefined()
    expect(json._id).toBeUndefined()
    expect(json.__v).toBeUndefined()
  })
})

describe('embeddedSchemaOptions', () => {
  const ChildSchema = new Schema({ label: String }, embeddedSchemaOptions)
  const ParentSchema = new Schema({ children: [ChildSchema] }, baseSchemaOptions)
  const ParentModel = model('Parent', ParentSchema)

  it('removes _id from embedded subdocument JSON output', async () => {
    const doc = await ParentModel.create({ children: [{ label: 'child' }] })
    const json = doc.toJSON()
    expect(json.children[0]._id).toBeUndefined()
    expect(json.children[0].label).toBe('child')
  })

  it('does not add timestamps to embedded subdocuments', async () => {
    const doc = await ParentModel.create({ children: [{ label: 'child' }] })
    const json = doc.toJSON()
    expect(json.children[0].createdAt).toBeUndefined()
    expect(json.children[0].updatedAt).toBeUndefined()
  })
})
