import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { showcases } from './showcase'

export const tenant = pgTable('tenant', {
  id: text().notNull().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
})

export const tenantRelations = relations(tenant, ({ many }) => ({
  showcase: many(showcases),
}))
