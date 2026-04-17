import type { SchemaOptions } from 'mongoose'

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
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret['_id']
    },
  },
}
