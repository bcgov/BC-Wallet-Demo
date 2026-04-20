import type { CredentialDefinition, CredentialStatus, DidMethod } from '../../content/types'

import { Schema, model } from 'mongoose'

import { AttributeSchema, baseSchemaOptions } from '../baseSchema'

// Maps to CredentialDefinition interface.
// schema_id and cred_def_id start empty and are written back after Traction
// registers the schema/cred-def on the ledger.
const CredentialDefinitionSchema = new Schema<CredentialDefinition>(
  {
    name: { type: String, required: true },
    version: { type: String, required: true },
    icon: String,
    attributes: [AttributeSchema],
    did_method: { type: String, enum: ['indy', 'webvh'] satisfies DidMethod[], required: true },
    schema_id: String,
    cred_def_id: String,
    status: { type: String, enum: ['active', 'retired'] satisfies CredentialStatus[], default: 'active' },
  },
  baseSchemaOptions,
)

// Compound unique index: the same credential name+version can exist for both
// did:indy and did:webvh, but not twice for the same method.
CredentialDefinitionSchema.index({ name: 1, version: 1, did_method: 1 }, { unique: true })

export const CredentialDefinitionModel = model<CredentialDefinition>('CredentialDefinition', CredentialDefinitionSchema)
