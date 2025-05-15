import { relations } from 'drizzle-orm'
import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { TenantType } from '../../types'
import { showcases } from './showcase'
import { tenantsToUsers } from './tenantsToUsers'

export const tenantTypePg = pgEnum('TenantType', Object.values(TenantType) as [string, ...string[]])

export const tenants = pgTable('tenant', {
  id: text().notNull().primaryKey(),
  tenantType: tenantTypePg().notNull().$type<TenantType>(),
  oidcIssuer: text('oidc_issuer').notNull(),
  tractionTenantId: uuid('traction_tenant_id'),
  tractionApiUrl: text('traction_api_url'),
  tractionWalletId: uuid('traction_wallet_id'),
  tractionApiKey: text('traction_api_key'),
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
