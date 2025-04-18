import { index, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { tenants } from './tenants'
import { users } from './user'

export const tenantsToUsers = pgTable(
  'tenantsToUsers',
  {
    tenant: text()
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    user: uuid()
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.tenant, t.user] }),
    index('tenants_to_users_tenant_idx').on(t.tenant),
    index('tenants_to_users_user_idx').on(t.user),
  ],
)

export const tenantsToUsersRelations = relations(tenantsToUsers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantsToUsers.tenant],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [tenantsToUsers.user],
    references: [users.id],
  }),
}))
