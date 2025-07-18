import { relations } from 'drizzle-orm'
import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core'

import { IssuerType } from '../../types'
import { assets } from './asset'
import { issuersToCredentialDefinitions } from './issuersToCredentialDefinitions'
import { issuersToCredentialSchemas } from './issuersToCredentialSchemas'
import { IssuerTypePg } from './issuerType'
import { tenants } from './tenants'

export const issuers = pgTable(
  'issuer',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    type: IssuerTypePg().notNull().$type<IssuerType>(),
    description: text().notNull(),
    organization: text(),
    logo: uuid().references(() => assets.id),
    tenantId: text('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_issuer_logo').on(t.logo), index('idx_issuer_tenant').on(t.tenantId)],
)

export const issuerRelations = relations(issuers, ({ one, many }) => ({
  cds: many(issuersToCredentialDefinitions),
  css: many(issuersToCredentialSchemas),
  logo: one(assets, {
    fields: [issuers.logo],
    references: [assets.id],
  }),
  tenant: one(tenants, {
    fields: [issuers.tenantId],
    references: [tenants.id],
  }),
}))
