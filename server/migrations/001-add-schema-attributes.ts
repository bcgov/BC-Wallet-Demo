import { SchemaModel } from '../src/db/models/Schema'

import schemaTypeSeedValues from './values/attributeTypes.json'

export async function up() {
  await SchemaModel.updateMany(
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
  // Update the seed schemas with the correct attribute types. All other schemas will be left with the default 'string' type for all attributes.
  await Promise.all(
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
}
