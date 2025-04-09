import { relations } from 'drizzle-orm'
import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { assets } from './asset'

export const personas = pgTable(
  'persona',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text().notNull(),
    slug: text().notNull().unique(),
    role: text().notNull(),
    description: text().notNull(),
    headshotImage: uuid('headshot_image').references(() => assets.id),
    bodyImage: uuid('body_image').references(() => assets.id),
    hidden: boolean().notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_headshotImage').on(t.headshotImage), index('idx_bodyImage').on(t.bodyImage)],
)

export const personaRelations = relations(personas, ({ one }) => ({
  headshotImage: one(assets, {
    fields: [personas.headshotImage],
    references: [assets.id],
    relationName: 'headshotImage',
  }),
  bodyImage: one(assets, {
    fields: [personas.bodyImage],
    references: [assets.id],
    relationName: 'bodyImage',
  },),
}))
