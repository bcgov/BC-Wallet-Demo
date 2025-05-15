import { relations } from 'drizzle-orm'
import { boolean, index, uniqueIndex, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { ShowcaseStatus } from '../../types'
import { assets } from './asset'
import { showcaseStatusPg } from './showcaseStatus'
import { showcasesToPersonas } from './showcasesToPersonas'
import { showcasesToScenarios } from './showcasesToScenarios'
import { tenants } from './tenants'
import { users } from './user'

export const showcases = pgTable(
  'showcase',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    tenantId: text('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    description: text().notNull(),
    completionMessage: text(),
    status: showcaseStatusPg().notNull().$type<ShowcaseStatus>(),
    hidden: boolean().notNull().default(false),
    bannerImage: uuid('banner_image').references(() => assets.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('idx_bannerImage').on(t.bannerImage),
    index('idx_tenant_id').on(t.tenantId),
    index('idx_sc_approvedBy').on(t.approvedBy),
    uniqueIndex('idx_tenant_slug_unique').on(t.tenantId, t.slug),
  ],
)

export const showcaseRelations = relations(showcases, ({ many, one }) => ({
  scenarios: many(showcasesToScenarios),
  personas: many(showcasesToPersonas),
  tenant: one(tenants, {
    fields: [showcases.tenantId],
    references: [tenants.id],
  }),
  approver: one(users, {
    fields: [showcases.approvedBy],
    references: [users.id],
  }),
  bannerImage: one(assets, {
    fields: [showcases.bannerImage],
    references: [assets.id],
  }),
  createdBy: one(users, {
    fields: [showcases.createdBy],
    references: [users.id],
  }),
}))
