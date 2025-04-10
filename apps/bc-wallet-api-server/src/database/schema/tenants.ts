import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { showcases } from './showcase'
import { tenantsToUsers } from './tenantsToUsers'

export const tenants = pgTable('tenant', {
  id: text().notNull().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp('deleted_at'),
})

export const tenantRelations = relations(tenants, ({ many }) => ({
  showcase: many(showcases),
  user: many(tenantsToUsers)
}))
