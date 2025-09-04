import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core'

export const jobStatus = pgTable('job_status', {
  jobId: uuid('job_id').primaryKey().defaultRandom(),
  apiName: text('api_name').notNull(),
  endpoint: text('endpoint').notNull(),
  payloadData: jsonb('payload_data'), // optional: store full payload
  status: text('status').notNull(), // e.g., 'pending', 'processing', 'success', 'failed'
  errorMessage: text('error_message'),
  resultData: jsonb('result_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
})
