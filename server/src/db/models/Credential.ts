import type { Credential } from '../../content/types'

import { Schema, model } from 'mongoose'

import { AttributeSchema, baseSchemaOptions } from '../baseSchema'

// Credential documents use a human-readable string _id (e.g. "student-card").
// baseSchemaOptions exposes it as `id` in JSON output via the virtuals transform.
const CredentialSchema = new Schema(
  {
    _id: { type: String },
    schema_id: { type: String, required: true },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    version: { type: String, required: true },
    attributes: [AttributeSchema],
  },
  baseSchemaOptions,
)

export const CredentialModel = model<Credential>('Credential', CredentialSchema)
