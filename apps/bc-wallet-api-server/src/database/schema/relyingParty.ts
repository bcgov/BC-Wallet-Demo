import { relations } from 'drizzle-orm'
import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core'

import { RelyingPartyType } from '../../types'
import { assets } from './asset'
import { relyingPartiesToCredentialDefinitions } from './relyingPartiesToCredentialDefinitions'
import { RelyingPartyTypePg } from './relyingPartyType'
import { tenants } from './tenants'

export const relyingParties = pgTable(
  'relyingParty',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    type: RelyingPartyTypePg().notNull().$type<RelyingPartyType>(),
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
  (t) => [index('idx_logo').on(t.logo), index('idx_rp_tenant').on(t.tenantId)],
)

export const relyingPartyRelations = relations(relyingParties, ({ one, many }) => ({
  cds: many(relyingPartiesToCredentialDefinitions),
  logo: one(assets, {
    fields: [relyingParties.logo],
    references: [assets.id],
  }),
  tenant: one(tenants, {
    fields: [relyingParties.tenantId],
    references: [tenants.id],
  }),
}))
