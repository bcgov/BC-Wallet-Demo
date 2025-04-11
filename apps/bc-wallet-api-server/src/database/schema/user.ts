import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { showcases } from './showcase'
import { tenantsToUsers } from './tenantsToUsers'

export const users = pgTable('user', {
  id: uuid('id').notNull().primaryKey(),
  userName: text(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const userRelations = relations(users, ({ many }) => ({
  showcase: many(showcases),
  tenants: many(tenantsToUsers),
}))
