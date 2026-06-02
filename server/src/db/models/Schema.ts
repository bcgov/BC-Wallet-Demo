import type { Schema as SchemaType } from '../../content/types'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

/** Shape returned by SchemaModel queries with .lean(). Uses _id, not the id virtual. */
export interface LeanSchemaDoc {
  _id: string
  name: string
  version: string
  attrNames: string[]
  credDefId?: string
}

// Schema documents use a human-readable string _id (e.g. "schema-id-from-traction").
// baseSchemaOptions exposes it as `id` in JSON output via the virtuals transform.
const SchemaSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    version: { type: String, required: true },
    attrNames: [{ type: String, required: true }],
    credDefId: { type: String },
  },
  baseSchemaOptions,
)

export const SchemaModel = model<SchemaType>('Schema', SchemaSchema)
