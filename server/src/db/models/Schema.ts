import type { Schema as SchemaType } from '../../content/types'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

/** Shape returned by SchemaModel queries with .lean(). Uses _id, not the id virtual. */

export type AttributeType = 'string' | 'date' | 'number' | 'image'

export interface SchemaAttribute {
  name: string
  type: AttributeType
}

export interface LeanSchemaDoc {
  _id: string
  name: string
  version: string
  attrNames: string[]
  attributes: SchemaAttribute[]
  credDefId?: string
  did?: string
}

// Schema documents use a human-readable string _id (e.g. "schema-id-from-traction").
// baseSchemaOptions exposes it as `id` in JSON output via the virtuals transform.
const SchemaSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    version: { type: String, required: true },
    // Legacy field from before we had attribute types. Not required and not used in new schemas, but still supported for old schemas.
    attrNames: [{ type: String, required: true }],
    attributes: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true, enum: ['string', 'date', 'number', 'image'] },
      },
    ],
    credDefId: { type: String },
    did: { type: String },
  },
  baseSchemaOptions,
)

export const SchemaModel = model<SchemaType>('Schema', SchemaSchema)
