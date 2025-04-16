import { relations } from 'drizzle-orm'
import { pgTable, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core'
import { showcases } from './showcase'
import { personas } from './persona'
import { index } from 'drizzle-orm/pg-core'

export const showcasesToPersonas = pgTable(
  'showcasesToPersonas',
  {
    showcase: uuid()
      .references(() => showcases.id, { onDelete: 'cascade' })
      .notNull(),
    persona: uuid()
      .references(() => personas.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [primaryKey({ columns: [t.showcase, t.persona] }), index('showcases_to_personas_showcase_idx').on(t.showcase)],
)

export const showcasesToPersonasRelations = relations(showcasesToPersonas, ({ one }) => ({
  persona: one(personas, {
    fields: [showcasesToPersonas.persona],
    references: [personas.id],
  }),
  showcase: one(showcases, {
    fields: [showcasesToPersonas.showcase],
    references: [showcases.id],
  }),
}))
