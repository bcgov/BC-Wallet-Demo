import { relations } from 'drizzle-orm'
import { pgTable, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core'
import { stepActions } from './stepAction'
import { AriesRequestCredentialAttribute, AriesRequestCredentialPredicate } from '../../types'

export const ariesProofRequests = pgTable('ariesProofRequest', {
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  attributes: jsonb().$type<Record<string, AriesRequestCredentialAttribute>>().notNull(),
  predicates: jsonb().$type<Record<string, AriesRequestCredentialPredicate>>().notNull(),
  stepAction: uuid('step_action')
    .references(() => stepActions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})

export const ariesProofRequestRelations = relations(ariesProofRequests, ({ one }) => ({
  stepAction: one(stepActions, {
    fields: [ariesProofRequests.stepAction],
    references: [stepActions.id],
  }),
}))
