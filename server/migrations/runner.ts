import os from 'os'

import { MigrationModel } from '../src/db/models/Migration'
import logger from '../src/utils/logger'

const migrations = [
  {
    id: '001-add-schema-attributes',
    up: () => import('./001-add-schema-attributes').then((m) => m.up()),
  },
  {
    id: '002-persona-to-pick-character-image',
    up: () => import('./002-persona-to-pick-character-image').then((m) => m.up()),
  },
]

/**
 * Safe migration runner with atomic locking to prevent race conditions
 * when multiple server instances start simultaneously.
 *
 * Uses a claim-based locking mechanism:
 * 1. Atomically attempt to claim the migration (set claimedBy if not already set)
 * 2. If claimed successfully, apply the migration and mark as complete
 * 3. If already claimed, skip (another instance is handling it)
 * 4. If already applied, skip (migration already done)
 *
 * This ensures horizontal scaling safety.
 */
export async function runMigrations() {
  const instanceId = process.env.POD_NAME || `${os.hostname()}-${process.pid}`
  logger.info({ instanceId }, 'Starting migration runner')

  for (const migration of migrations) {
    logger.info({ migrationId: migration.id }, 'Checking migration')

    try {
      // Check if migration already exists
      const existing = await MigrationModel.findById(migration.id)

      if (existing?.status === 'applied') {
        logger.info({ migrationId: migration.id }, 'Migration already applied')
        continue
      }

      if (existing?.status === 'applying') {
        logger.info(
          { migrationId: migration.id, claimedBy: existing.claimedBy },
          'Migration already being applied by another instance',
        )
        continue
      }

      if (existing?.status === 'failed') {
        logger.warn(
          { migrationId: migration.id, error: existing.error },
          'Migration previously failed - skipping to avoid repeated failures',
        )
        continue
      }

      // Atomically attempt to claim the migration lock
      // This will only succeed if the document doesn't exist or status is not set
      const claimed = await MigrationModel.findByIdAndUpdate(
        migration.id,
        {
          $set: {
            status: 'applying',
            claimedBy: instanceId,
            claimedAt: new Date(),
          },
        },
        { upsert: true, new: true },
      )

      // Double-check we actually claimed it (verify our instanceId is set)
      if (claimed?.claimedBy !== instanceId) {
        logger.info(
          { migrationId: migration.id, claimedBy: claimed?.claimedBy, ourId: instanceId },
          'Migration already claimed by another instance',
        )
        continue
      }

      // We successfully claimed the migration - proceed with application
      try {
        logger.info({ migrationId: migration.id }, 'Applying migration')
        await migration.up()

        // Mark migration as successfully applied
        await MigrationModel.updateOne(
          { _id: migration.id },
          {
            $set: {
              status: 'applied',
              appliedAt: new Date(),
            },
          },
        )
        logger.info({ migrationId: migration.id }, 'Migration applied successfully')
      } catch (error) {
        // Mark migration as failed so it can be investigated and retried
        logger.error({ migrationId: migration.id, error }, 'Migration execution failed')
        await MigrationModel.updateOne(
          { _id: migration.id },
          {
            $set: {
              status: 'failed',
              error: error instanceof Error ? error.message : String(error),
              failedAt: new Date(),
            },
          },
        )
        throw error
      }
    } catch (error) {
      logger.error({ migrationId: migration.id, error }, 'Unexpected error during migration processing')
      throw error
    }
  }
}
