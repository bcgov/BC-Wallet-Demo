import { SchemaModel } from '../src/db/models/Schema'
import logger from '../src/utils/logger'

export async function up() {
  try {
    logger.info('Migration 004: Starting picture attribute type conversion to image')

    const updateResult = await SchemaModel.updateOne(
      { name: 'Person', version: '2.0' },
      {
        $set: {
          'attributes.$[elem].type': 'image',
        },
      },
      {
        arrayFilters: [{ 'elem.name': 'picture' }],
      },
    )

    logger.info(
      { modifiedCount: updateResult.modifiedCount },
      'Migration 004: Person credential picture attribute type updated',
    )

    if (updateResult.modifiedCount === 0) {
      logger.warn('Migration 004: No Person schema found or picture attribute already of type image')
    }

    logger.info('Migration 004 completed')
  } catch (error) {
    logger.error({ error }, 'Error in migration 004')
    throw error
  }
}
