import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import { AuditLogModel } from '../../db/models/AuditLog'
import { AuditLogService } from '../AuditLogService'

let mongod: MongoMemoryServer
let service: AuditLogService

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  await AuditLogModel.syncIndexes()
  service = new AuditLogService()
})

afterEach(async () => {
  await AuditLogModel.deleteMany({})
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('AuditLogService', () => {
  describe('log()', () => {
    it('creates a document in the database', async () => {
      await service.log({
        user_id: 'user-abc',
        action: 'created',
        resource_type: 'showcase',
        resource_id: 'showcase-1',
        details: { name: 'Test' },
      })

      const docs = await AuditLogModel.find({})
      expect(docs).toHaveLength(1)
      expect(docs[0].user_id).toBe('user-abc')
      expect(docs[0].action).toBe('created')
      expect(docs[0].resource_id).toBe('showcase-1')
    })

    it('auto-sets createdAt to current time', async () => {
      const before = new Date()
      await service.log({ user_id: 'user-abc', action: 'login', resource_type: 'user' })
      const after = new Date()

      const doc = await AuditLogModel.findOne({})
      expect(doc!.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(doc!.createdAt.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('query()', () => {
    const entries = [
      { user_id: 'user-1', action: 'created' as const, resource_type: 'showcase' as const },
      { user_id: 'user-2', action: 'updated' as const, resource_type: 'showcase' as const },
      { user_id: 'user-3', action: 'deleted' as const, resource_type: 'credential_definition' as const },
    ]

    it('returns paginated results', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 1, limit: 2 })
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
    })

    it('returns correct second page', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 2, limit: 2 })
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(3)
    })

    it('sorts results newest first', async () => {
      for (const e of entries) {
        await service.log(e)
        await new Promise((r) => setTimeout(r, 5))
      }

      const result = await service.query({ page: 1, limit: 10 })
      const timestamps = result.data.map((d) => new Date(d.createdAt).getTime())
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i])
      }
    })

    it('filters by startDate', async () => {
      const past = new Date('2020-01-01')
      const recent = new Date()

      await AuditLogModel.create({ ...entries[0], createdAt: past })
      await AuditLogModel.create({ ...entries[1], createdAt: recent })

      const cutoff = new Date('2021-01-01')
      const result = await service.query({ page: 1, limit: 10, startDate: cutoff })
      expect(result.total).toBe(1)
      expect(new Date(result.data[0].createdAt).getTime()).toBeGreaterThanOrEqual(cutoff.getTime())
    })

    it('filters by endDate', async () => {
      const past = new Date('2020-01-01')
      const recent = new Date()

      await AuditLogModel.create({ ...entries[0], createdAt: past })
      await AuditLogModel.create({ ...entries[1], createdAt: recent })

      const cutoff = new Date('2021-01-01')
      const result = await service.query({ page: 1, limit: 10, endDate: cutoff })
      expect(result.total).toBe(1)
      expect(new Date(result.data[0].createdAt).getTime()).toBeLessThanOrEqual(cutoff.getTime())
    })

    it('filters by both startDate and endDate', async () => {
      const dates = [new Date('2020-01-01'), new Date('2021-06-15'), new Date('2022-12-31')]
      for (let i = 0; i < entries.length; i++) {
        await AuditLogModel.create({ ...entries[i], createdAt: dates[i] })
      }

      const result = await service.query({
        page: 1,
        limit: 10,
        startDate: new Date('2021-01-01'),
        endDate: new Date('2021-12-31'),
      })
      expect(result.total).toBe(1)
      expect(new Date(result.data[0].createdAt).getFullYear()).toBe(2021)
    })

    it('filters by single action', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 1, limit: 10, actions: ['created'] })
      expect(result.total).toBe(1)
      expect(result.data[0].action).toBe('created')
    })

    it('filters by multiple actions', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 1, limit: 10, actions: ['created', 'deleted'] })
      expect(result.total).toBe(2)
      expect(result.data.every((d) => ['created', 'deleted'].includes(d.action))).toBe(true)
    })

    it('filters by resource_type', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 1, limit: 10, resourceTypes: ['credential_definition'] })
      expect(result.total).toBe(1)
      expect(result.data[0].resource_type).toBe('credential_definition')
    })

    it('filters by user_id', async () => {
      for (const e of entries) await service.log(e)

      const result = await service.query({ page: 1, limit: 10, userId: 'user-2' })
      expect(result.total).toBe(1)
      expect(result.data[0].user_id).toBe('user-2')
    })

    it('returns empty data when no entries match', async () => {
      const result = await service.query({ page: 1, limit: 50 })
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })
})
