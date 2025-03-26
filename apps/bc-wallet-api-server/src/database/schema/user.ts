import { pgTable, text } from 'drizzle-orm/pg-core'
import { timestamp, uuid } from 'drizzle-orm/pg-core'
import { IdentifierTypePg } from './identifierType'
import { IdentifierType } from '../../types'
import { relations } from 'drizzle-orm'
import { showcases } from './showcase'

export const users = pgTable('user', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  identifierType: IdentifierTypePg('identifier_type').$type<IdentifierType>(),
  identifier: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const userRelations = relations(users, ({ many }) => ({
  showcase: many(showcases),
}))
