import { relations } from 'drizzle-orm'
import { index, pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { scenarios } from './scenario'
import { personas } from './persona'

export const scenariosToPersonas = pgTable(
  'scenariosToPersonas',
  {
    scenario: uuid()
      .references(() => scenarios.id, { onDelete: 'cascade' })
      .notNull(),
    persona: uuid()
      .references(() => personas.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.scenario, t.persona] }), index('idx_scenario').on(t.scenario)],
)

export const scenariosToPersonasRelations = relations(scenariosToPersonas, ({ one }) => ({
  scenario: one(scenarios, {
    fields: [scenariosToPersonas.scenario],
    references: [scenarios.id],
  }),
  persona: one(personas, {
    fields: [scenariosToPersonas.persona],
    references: [personas.id],
  }),
}))
