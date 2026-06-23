import { SchemaModel } from '../src/db/models/Schema'
import logger from '../src/utils/logger'

import schemaTypeSeedValues from './values/attributeTypes.json'

export async function up() {
  try {
    logger.info('Migration 001: Starting schema attribute transformation')

    const updateResult = await SchemaModel.updateMany(
      { attrNames: { $exists: true } },
      [
        {
          $set: {
            attributes: {
              $map: {
                input: '$attrNames',
                as: 'name',
                in: {
                  name: '$$name',
                  type: 'string',
                },
              },
            },
          },
        },
      ],
      { updatePipeline: true },
    )
    logger.info({ modifiedCount: updateResult.modifiedCount }, 'Migration 001: Generic schema attributes updated')

    // Update the seed schemas with the correct attribute types. All other schemas will be left with the default 'string' type for all attributes.
    const seedUpdateResults = await Promise.all(
      schemaTypeSeedValues.map((schema: any) =>
        SchemaModel.updateOne(
          { name: schema.name, version: schema.version },
          {
            $set: {
              attributes: schema.attributes,
            },
          },
        ),
      ),
    )
    logger.info({ count: seedUpdateResults.length }, 'Migration 001: Seed schema attributes updated')
    logger.info('Migration 001 completed')
  } catch (error) {
    logger.error({ error }, 'Error in migration 001')
    throw error
  }
}
