import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

import { showcases } from './showcase'
import { tenantsToUsers } from './tenantsToUsers'

export const tenants = pgTable('tenant', {
  id: text().notNull().primaryKey(),
  realm: text().notNull(),
  clientId: text('client_id').notNull(),
  clientSecret: text('client_secret').notNull(),
  nonceBase64: text('nonce_base_64'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
})

export const tenantRelations = relations(tenants, ({ many }) => ({
  showcase: many(showcases),
  users: many(tenantsToUsers),
}))
