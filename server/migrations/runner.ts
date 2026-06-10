import { MigrationModel } from '../src/db/models/Migration'
import logger from '../src/utils/logger'

const migrations = [
  {
    id: '001-add-schema-attributes',
    up: () => import('./001-add-schema-attributes').then((m) => m.up()),
  },
]

export async function runMigrations() {
  for (const migration of migrations) {
    logger.info({ migrationId: migration.id }, 'Checking migration')
    const applied = await MigrationModel.exists({
      _id: migration.id,
    })

    if (applied) {
      logger.info({ migrationId: migration.id }, 'Migration already applied')
      continue
    }

    logger.info({ migrationId: migration.id }, 'Applying migration')
    await migration.up()

    await MigrationModel.create({
      _id: migration.id,
      appliedAt: new Date(),
    })
  }
}
