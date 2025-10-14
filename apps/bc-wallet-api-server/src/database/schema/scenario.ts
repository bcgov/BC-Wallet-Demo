import { relations, sql } from 'drizzle-orm'
import { check, pgTable, text, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core'

import { ScenarioType } from '../../types'
import { assets } from './asset'
import { issuers } from './issuer'
import { relyingParties } from './relyingParty'
import { scenariosToPersonas } from './scenariosToPersonas'
import { ScenarioTypePg } from './scenarioType'
import { steps } from './step'

export const scenarios = pgTable(
  'scenario',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    description: text().notNull(),
    scenarioType: ScenarioTypePg('scenario_type').notNull().$type<ScenarioType>(),
    issuer: uuid().references(() => issuers.id, { onDelete: 'set null' }),
    hidden: boolean().notNull().default(false),
    relyingParty: uuid('relying_party').references(() => relyingParties.id, { onDelete: 'set null' }),
    bannerImage: uuid('banner_image').references(() => assets.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      'scenario_type_check',
      sql`
            (scenario_type = 'PRESENTATION' AND relying_party IS NOT NULL) OR
            (scenario_type = 'ISSUANCE' AND issuer IS NOT NULL) OR
            (issuer IS NULL AND relying_party IS NULL)
    `,
    ),
    index('idx_relyingParty_issuer_scenario').on(t.relyingParty),
    index('idx_issuer_scenario').on(t.issuer),
    index('idx_bannerImage_issuer_scenario').on(t.bannerImage),
  ],
)

export const scenarioRelations = relations(scenarios, ({ one, many }) => ({
  personas: many(scenariosToPersonas),
  steps: many(steps, {
    relationName: 'steps_scenario',
  }),
  issuer: one(issuers, {
    fields: [scenarios.issuer],
    references: [issuers.id],
  }),
  relyingParty: one(relyingParties, {
    fields: [scenarios.relyingParty],
    references: [relyingParties.id],
  }),
  bannerImage: one(assets, {
    fields: [scenarios.bannerImage],
    references: [assets.id],
  }),
}))
