import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { MigrationModel } from '../../src/db/models/Migration'
import logger from '../../src/utils/logger'

// Mock logger
vi.mock('../../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock dynamic import of migrations - default success
const migrationUpMock = vi.fn().mockResolvedValue(undefined)
const migration002UpMock = vi.fn().mockResolvedValue(undefined)
vi.mock('../001-add-schema-attributes', async () => ({
  up: migrationUpMock,
}))
vi.mock('../002-persona-to-pick-character-image', async () => ({
  up: migration002UpMock,
}))

let mongod: MongoMemoryServer

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterEach(async () => {
  await MigrationModel.deleteMany({})
  vi.clearAllMocks()
  // Reset migration mocks to default success
  migrationUpMock.mockResolvedValue(undefined)
  migration002UpMock.mockResolvedValue(undefined)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

describe('runMigrations', () => {
  it('successfully applies a new migration', async () => {
    const { runMigrations } = await import('../runner')
    process.env.POD_NAME = 'test-instance-1'

    await runMigrations()

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration).toBeDefined()
    expect(migration?.status).toBe('applied')
    expect(migration?.claimedBy).toBe('test-instance-1')
    expect(migration?.appliedAt).toBeDefined()
    expect(logger.info).toHaveBeenCalledWith({ migrationId: '001-add-schema-attributes' }, 'Checking migration')
    expect(logger.info).toHaveBeenCalledWith({ migrationId: '001-add-schema-attributes' }, 'Applying migration')
    expect(logger.info).toHaveBeenCalledWith(
      { migrationId: '001-add-schema-attributes' },
      'Migration applied successfully',
    )
  })

  it('skips a migration that is already applied', async () => {
    const { runMigrations } = await import('../runner')

    // Pre-populate with an applied migration
    await MigrationModel.create({
      _id: '001-add-schema-attributes',
      status: 'applied',
      claimedBy: 'other-instance',
      appliedAt: new Date(),
    })

    await runMigrations()

    expect(logger.info).toHaveBeenCalledWith({ migrationId: '001-add-schema-attributes' }, 'Migration already applied')
    // Verify migration.up() was not called
    expect(migrationUpMock).not.toHaveBeenCalled()
  })

  it('skips a migration being applied by another instance', async () => {
    const { runMigrations } = await import('../runner')

    // Pre-populate with a migration in progress
    await MigrationModel.create({
      _id: '001-add-schema-attributes',
      status: 'applying',
      claimedBy: 'other-instance',
      claimedAt: new Date(),
    })

    await runMigrations()

    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ migrationId: '001-add-schema-attributes' }),
      'Migration already being applied by another instance',
    )
    // Verify migration.up() was not called
    expect(migrationUpMock).not.toHaveBeenCalled()
  })

  it('skips a migration that previously failed', async () => {
    const { runMigrations } = await import('../runner')

    // Pre-populate with a failed migration
    await MigrationModel.create({
      _id: '001-add-schema-attributes',
      status: 'failed',
      claimedBy: 'test-instance-1',
      error: 'Previous error',
      failedAt: new Date(),
    })
    // Pre-populate migration 002 as applied to avoid it running
    await MigrationModel.create({
      _id: '002-persona-to-pick-character-image',
      status: 'applied',
      claimedBy: 'test-instance-1',
      appliedAt: new Date(),
    })

    await runMigrations()

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        migrationId: '001-add-schema-attributes',
        error: 'Previous error',
      }),
      'Migration previously failed - skipping to avoid repeated failures',
    )
    // Verify migration.up() was not called
    expect(migrationUpMock).not.toHaveBeenCalled()
  })

  it('marks migration as failed when execution throws an error', async () => {
    const { runMigrations } = await import('../runner')
    process.env.POD_NAME = 'test-instance-1'

    const testError = new Error('Migration execution failed')
    migrationUpMock.mockRejectedValueOnce(testError)

    try {
      await runMigrations()
    } catch {
      // Expected to throw
    }

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration?.status).toBe('failed')
    expect(migration?.error).toBe('Migration execution failed')
    expect(migration?.failedAt).toBeDefined()
    expect(logger.error).toHaveBeenCalledWith(
      { migrationId: '001-add-schema-attributes', error: testError },
      'Migration execution failed',
    )
  })

  it('uses POD_NAME environment variable for instance ID', async () => {
    const { runMigrations } = await import('../runner')
    process.env.POD_NAME = 'pod-abc-123'

    await runMigrations()

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration?.claimedBy).toBe('pod-abc-123')
  })

  it('uses hostname and PID as fallback for instance ID when POD_NAME is not set', async () => {
    const { runMigrations } = await import('../runner')
    delete process.env.POD_NAME

    await runMigrations()

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration?.claimedBy).toMatch(/^[\w-]+-\d+$/) // hostname-pid format
  })

  it('handles non-Error exceptions during migration execution', async () => {
    const { runMigrations } = await import('../runner')
    process.env.POD_NAME = 'test-instance-1'

    migrationUpMock.mockRejectedValueOnce('String error')

    try {
      await runMigrations()
    } catch {
      // Expected to throw
    }

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration?.status).toBe('failed')
    expect(migration?.error).toBe('String error')
  })

  it('verifies claim was successful by checking instanceId match', async () => {
    const { runMigrations } = await import('../runner')
    process.env.POD_NAME = 'test-instance-1'

    await runMigrations()

    const migration = await MigrationModel.findById('001-add-schema-attributes')
    expect(migration?.claimedBy).toBe('test-instance-1')
    expect(migration?.status).toBe('applied')
    expect(migrationUpMock).toHaveBeenCalled()
  })

  it('continues to next migration after skipping already-applied one', async () => {
    // This test verifies the loop continues properly
    const { runMigrations } = await import('../runner')

    await MigrationModel.create({
      _id: '001-add-schema-attributes',
      status: 'applied',
      claimedBy: 'other-instance',
      appliedAt: new Date(),
    })

    // Should not throw even though first migration is skipped
    await runMigrations()

    expect(logger.info).toHaveBeenCalledWith({ migrationId: '001-add-schema-attributes' }, 'Checking migration')
  })
})
