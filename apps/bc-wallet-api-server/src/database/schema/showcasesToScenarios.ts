import { relations } from 'drizzle-orm'
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { showcases } from './showcase'
import { scenarios } from './scenario'

export const showcasesToScenarios = pgTable(
  'showcasesToScenarios',
  {
    showcase: uuid()
      .references(() => showcases.id, { onDelete: 'cascade' })
      .notNull(),
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.showcase, t.scenario] }), index('showcases_to_scenarios_showcase_idx').on(t.showcase)],
)

export const showcasesToScenariosRelations = relations(showcasesToScenarios, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [showcasesToScenarios.scenario],
    references: [scenarios.id],
  }),
  showcase: one(showcases, {
    fields: [showcasesToScenarios.showcase],
    references: [showcases.id],
  }),
}))
