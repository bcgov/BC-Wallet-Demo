import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core'

import { jobStatus } from './jobStatus'

export const jobEntityMap = pgTable(
  'job_entity_map',
  {
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobStatus.jobId),
    entityType: text('entity_type').notNull(), // e.g., 'order', 'report'
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(), // e.g., 'create', 'update'
    status: text('status').default('pending'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    entityIndex: index('idx_entity_type_id').on(table.entityType, table.entityId),
  }),
)
