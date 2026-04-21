import type { SchemaOptions } from 'mongoose'

import { Schema } from 'mongoose'

export const baseSchemaOptions: SchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['_id']
      delete ret['__v']
    },
  },
}

export const embeddedSchemaOptions: SchemaOptions = {
  // Prevents MongoDB from generating _id on every subdocument, which wastes
  // storage and breaks array update operators like $pull by value.
  _id: false,
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['_id']
    },
  },
}

// Shared attribute schema used by Credential to ensure name is always validated.
export const AttributeSchema = new Schema<{ name: string; value: string }>(
  { name: { type: String, required: true }, value: String },
  embeddedSchemaOptions,
)
