import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './tenants'
import { users } from './user'

export const tenantsToUsers = pgTable(
  'tenantsToUsers',
  {
    tenant: uuid()
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    user: uuid().references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.tenant, t.user] })],
)

export const tenantsToUsersRelations = relations(tenantsToUsers, ({ one }) => ({
  scenario: one(tenants, {
    fields: [tenantsToUsers.tenant],
    references: [tenants.id],
  }),
  showcase: one(users, {
    fields: [tenantsToUsers.user],
    references: [users.id],
  }),
}))