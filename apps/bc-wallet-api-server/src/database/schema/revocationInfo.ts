import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { credentialDefinitions } from './credentialDefinition'

export const revocationInfo = pgTable(
  'revocationInfo',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    title: text().notNull(),
    description: text().notNull(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_revocation_info').on(t.credentialDefinition)],
)

export const revocationInfoRelations = relations(revocationInfo, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [revocationInfo.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
}))
