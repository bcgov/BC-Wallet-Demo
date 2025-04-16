import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, timestamp, uuid, index } from 'drizzle-orm/pg-core'
import { showcases } from './showcase'
import { credentialDefinitions } from './credentialDefinition'

export const showcasesToCredentialDefinitions = pgTable(
  'showcasesToCredentialDefinitions',
  {
    showcase: uuid()
      .references(() => showcases.id, { onDelete: 'cascade' })
      .notNull(),
    credentialDefinition: uuid('credential_definition')
      .references(() => credentialDefinitions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.showcase, t.credentialDefinition] }), index('showcases_to_credential_definitions_showcase_idx').on(t.showcase)],
)

export const showcasesToCredentialDefinitionsRelations = relations(showcasesToCredentialDefinitions, ({ one }) => ({
  credentialDefinition: one(credentialDefinitions, {
    fields: [showcasesToCredentialDefinitions.credentialDefinition],
    references: [credentialDefinitions.id],
  }),
  showcase: one(showcases, {
    fields: [showcasesToCredentialDefinitions.showcase],
    references: [showcases.id],
  }),
}))
