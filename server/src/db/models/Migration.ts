interface Migration {
  _id: string
  appliedAt: Date
}

import { Schema, model } from 'mongoose'

const MigrationSchema = new Schema<Migration>(
  {
    _id: { type: String, required: true },
    appliedAt: { type: Date, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
  },
)

export const MigrationModel = model<Migration>('Migration', MigrationSchema)
