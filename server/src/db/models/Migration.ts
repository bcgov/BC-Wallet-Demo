import { Schema, model } from 'mongoose'

interface Migration {
  _id: string
  status: 'applying' | 'applied' | 'failed'
  claimedBy?: string
  claimedAt?: Date
  appliedAt?: Date
  failedAt?: Date
  error?: string
}

const MigrationSchema = new Schema<Migration>(
  {
    _id: { type: String, required: true },
    status: { type: String, enum: ['applying', 'applied', 'failed'], default: 'applied' },
    claimedBy: { type: String },
    claimedAt: { type: Date },
    appliedAt: { type: Date },
    failedAt: { type: Date },
    error: { type: String },
  },
  {
    timestamps: false,
    versionKey: false,
  },
)

export const MigrationModel = model<Migration>('Migration', MigrationSchema)
