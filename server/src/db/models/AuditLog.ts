import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

export type AuditAction = 'created' | 'updated' | 'deleted' | 'registered' | 'retired' | 'login'
export type AuditResourceType = 'showcase' | 'credential_definition' | 'user'

export const AUDIT_ACTIONS: AuditAction[] = ['created', 'updated', 'deleted', 'registered', 'retired', 'login']
export const AUDIT_RESOURCE_TYPES: AuditResourceType[] = ['showcase', 'credential_definition', 'user']

export interface AuditLog {
  createdAt: Date
  user_id: string
  action: AuditAction
  resource_type: AuditResourceType
  resource_id?: string
  details?: Record<string, unknown>
}

// Read at module load time. If changed, Mongoose syncIndexes() on restart will update the TTL.
// Note: MongoDB TTL index expireAfterSeconds can only be updated via collMod or index recreation.
const retentionDays = Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 90
const expireAfterSeconds = retentionDays * 86400

const AuditLogSchema = new Schema<AuditLog>(
  {
    // createdAt is auto-managed by baseSchemaOptions (timestamps: true).
    // No manual timestamp field needed.
    user_id: { type: String, required: true },
    action: {
      type: String,
      required: true,
      enum: AUDIT_ACTIONS,
    },
    resource_type: {
      type: String,
      required: true,
      enum: AUDIT_RESOURCE_TYPES,
    },
    resource_id: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  baseSchemaOptions,
)

// TTL index on createdAt -- documents expire after retentionDays.
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds })

// Index for filtering by user.
AuditLogSchema.index({ user_id: 1 })

export const AuditLogModel = model<AuditLog>('AuditLog', AuditLogSchema)
