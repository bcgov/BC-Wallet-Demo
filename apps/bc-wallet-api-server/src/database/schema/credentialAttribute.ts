import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { CredentialAttributeTypePg } from './credentialAttributeType'
import { CredentialAttributeType } from '../../types'
import { credentialSchemas } from './credentialSchema'

export const credentialAttributes = pgTable(
  'credentialAttribute',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    value: text().notNull(),
    type: CredentialAttributeTypePg().notNull().$type<CredentialAttributeType>(),
    credentialSchema: uuid('credential_schema')
      .references(() => credentialSchemas.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_credential_attributes').on(t.credentialSchema)],
)

export const credentialAttributeRelations = relations(credentialAttributes, ({ one }) => ({
  credentialSchema: one(credentialSchemas, {
    fields: [credentialAttributes.credentialSchema],
    references: [credentialSchemas.id],
  }),
}))
