import type { Credential } from '../../content/types'

import { Schema, model } from 'mongoose'

import { AttributeSchema, baseSchemaOptions } from '../baseSchema'

/** Shape returned by CredentialModel queries with .lean(). Uses _id, not the id virtual. */
export interface LeanCredentialDoc {
  _id: string
  name: string
  icon: string
  version: string
  attributes: { name: string; value: string }[]
  schema_id?: string
  cred_def_id?: string
  status?: 'active' | 'retired'
}

// Credential documents use a human-readable string _id (e.g. "student-card").
// baseSchemaOptions exposes it as `id` in JSON output via the virtuals transform.
const CredentialSchema = new Schema(
  {
    _id: { type: String },
    name: { type: String, required: true },
    icon: { type: String, required: true },
    version: { type: String, required: true },
    attributes: [AttributeSchema],
    schema_id: { type: String },
    cred_def_id: { type: String },
    status: { type: String, enum: ['active', 'retired'], default: 'active' },
  },
  baseSchemaOptions,
)

export const CredentialModel = model<Credential>('Credential', CredentialSchema)
