import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuditLogModel } from '../models/AuditLog'

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  await AuditLogModel.syncIndexes()
})

afterEach(async () => {
  await AuditLogModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('AuditLogModel', () => {
  it('persists an audit log entry with all fields', async () => {
    const doc = await AuditLogModel.create({
      user_id: 'user-123',
      action: 'created',
      resource_type: 'showcase',
      resource_id: 'showcase-abc',
      details: { name: 'Student Showcase' },
    })
    const json = doc.toJSON()
    expect(json.user_id).toBe('user-123')
    expect(json.action).toBe('created')
    expect(json.resource_type).toBe('showcase')
    expect(json.resource_id).toBe('showcase-abc')
    expect(json.details).toEqual({ name: 'Student Showcase' })
    expect(json.createdAt).toBeInstanceOf(Date)
  })

  it('auto-sets createdAt to current time', async () => {
    const before = new Date()
    const doc = await AuditLogModel.create({
      user_id: 'user-123',
      action: 'login',
      resource_type: 'user',
    })
    const after = new Date()
    expect(doc.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(doc.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('rejects entry with missing user_id', async () => {
    await expect(AuditLogModel.create({ action: 'created', resource_type: 'showcase' })).rejects.toThrow()
  })

  it('rejects entry with missing action', async () => {
    await expect(AuditLogModel.create({ user_id: 'user-123', resource_type: 'showcase' })).rejects.toThrow()
  })

  it('rejects entry with missing resource_type', async () => {
    await expect(AuditLogModel.create({ user_id: 'user-123', action: 'created' })).rejects.toThrow()
  })

  it('rejects entry with invalid action value', async () => {
    await expect(
      AuditLogModel.create({ user_id: 'user-123', action: 'invalid', resource_type: 'showcase' }),
    ).rejects.toThrow()
  })

  it('rejects entry with invalid resource_type value', async () => {
    await expect(
      AuditLogModel.create({ user_id: 'user-123', action: 'created', resource_type: 'unknown' }),
    ).rejects.toThrow()
  })

  it('accepts arbitrary JSON in details field', async () => {
    const details = { nested: { count: 42, tags: ['a', 'b'] }, flag: true }
    const doc = await AuditLogModel.create({
      user_id: 'user-123',
      action: 'updated',
      resource_type: 'credential_definition',
      details,
    })
    expect(doc.toJSON().details).toEqual(details)
  })

  it('TTL index exists on createdAt field', async () => {
    const indexes = await AuditLogModel.collection.indexes()
    const ttlIndex = indexes.find((idx) => idx.key?.createdAt === 1 && idx.expireAfterSeconds != null)
    expect(ttlIndex).toBeDefined()
    expect(ttlIndex?.expireAfterSeconds).toBeGreaterThan(0)
  })
})
