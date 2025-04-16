import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { personas, scenarios, showcases } from '../../database/schema'
import * as schema from '../../database/schema'

export type Schemas = typeof showcases | typeof personas | typeof scenarios

export type GenerateSlugArgs = {
  value: string
  id?: string
  connection: NodePgDatabase<typeof schema>
  schema: Schemas
}
