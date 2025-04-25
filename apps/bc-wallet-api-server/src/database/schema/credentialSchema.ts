import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { IdentifierType, Source } from '../../types'
import { credentialAttributes } from './credentialAttribute'
import { IdentifierTypePg } from './identifierType'
import { SourcePg } from './sourceType'

export const credentialSchemas = pgTable('credentialSchema', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  identifierType: IdentifierTypePg('identifier_type').$type<IdentifierType>(),
  source: SourcePg().$type<Source>().notNull().default(Source.CREATED),
  identifier: text(),
  name: text().notNull(),
  version: text().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const credentialSchemaRelations = relations(credentialSchemas, ({ many }) => ({
  attributes: many(credentialAttributes),
}))
