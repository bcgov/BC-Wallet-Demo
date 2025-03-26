import { relations } from 'drizzle-orm'
import { pgTable, uuid, timestamp, text, index } from 'drizzle-orm/pg-core'
import { steps } from './step'
import { ariesProofRequests } from './ariesProofRequest'
import { StepActionType } from '../../types'

export const stepActions = pgTable(
  'stepAction',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    actionType: text('action_type').notNull().$type<StepActionType>(),
    title: text().notNull(),
    text: text().notNull(),
    step: uuid()
      .references(() => steps.id, { onDelete: 'cascade' })
      .notNull(),
    credentialDefinitionId: text('credential_definition_id'), // TODO redesign when we get more properties
    connectionId: text('connection_id'), // TODO redesign when we get more properties
    goToStep: text('go_to_step'), // TODO redesign when we get more properties
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('idx_step_actions').on(t.step)],
)

export const stepActionRelations = relations(stepActions, ({ one }) => ({
  step: one(steps, {
    fields: [stepActions.step],
    references: [steps.id],
  }),
  proofRequest: one(ariesProofRequests),
}))
