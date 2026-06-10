import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

/** Shape returned by IssuedCredentialModel queries with .lean(). */
export interface LeanIssuedCredentialDoc {
  _id: string
  credential_id?: string
  connection_id: string
  format: 'anoncreds'
  status: 'issued' | 'revoked'
  revoked_at: Date | null
  format_metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

const IssuedCredentialSchema = new Schema(
  {
    // Uses cred_ex_id from Traction webhook as the document ID.
    _id: { type: String, required: true },
    // References the internal Credential document _id (credential definition).
    // Optional: may not resolve if cred_def_id missing from webhook payload.
    credential_id: { type: String },
    connection_id: { type: String, required: true, index: true },
    format: { type: String, enum: ['anoncreds'], required: true },
    status: { type: String, enum: ['issued', 'revoked'], default: 'issued', index: true },
    revoked_at: { type: Date, default: null },
    // Opaque per-format data: anoncreds = { rev_reg_id, cred_rev_id, cred_def_id }
    format_metadata: { type: Schema.Types.Mixed, required: true },
  },
  baseSchemaOptions,
)

// TTL: auto-delete after 7 days. Showcase sessions are ephemeral; 7 days
// gives buffer for debugging without unbounded collection growth.
IssuedCredentialSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })

export const IssuedCredentialModel = model('IssuedCredential', IssuedCredentialSchema)
