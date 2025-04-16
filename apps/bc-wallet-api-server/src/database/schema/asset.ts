import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { customBytea } from '../customTypes/pg'
import { relations } from 'drizzle-orm'
import { personas } from './persona'
import { showcases } from './showcase'

export const assets = pgTable('asset', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  mediaType: text('media_type').notNull(),
  fileName: text('file_name'),
  description: text(),
  content: customBytea().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const assetRelations = relations(assets, ({ many }) => ({
  personas: many(personas),
  showcases: many(showcases),
}))
