import { Schema, model } from 'mongoose'
interface Migration {
  _id: string
  appliedAt: Date
}

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
