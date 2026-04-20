import type { CredentialRequest, CustomUseCase, UseCaseScreen } from '../../content/types'

import { Schema } from 'mongoose'

import { embeddedSchemaOptions } from '../baseSchema'

// predicates.value allows runtime functions in types.ts (e.g. to compute the
// current date at issuance), but functions cannot be persisted in MongoDB.
// Callers must resolve any function values before saving a document.
type PersistedCredentialRequest = Omit<CredentialRequest, 'predicates'> & {
  predicates?: { name: string; type: string; value?: string | number }
}

const CredentialRequestSchema = new Schema<PersistedCredentialRequest>(
  {
    name: { type: String, required: true },
    icon: String,
    schema_id: String,
    cred_def_id: String,
    predicates: {
      name: String,
      type: String,
      value: Schema.Types.Mixed,
    },
    properties: [String],
    nonRevoked: {
      to: Number,
      from: Number,
    },
  },
  embeddedSchemaOptions,
)

const UseCaseScreenSchema = new Schema<UseCaseScreen>(
  {
    screenId: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    image: String,
    verifier: {
      name: String,
      icon: String,
    },
    requestOptions: {
      title: String,
      text: String,
      requestedCredentials: [CredentialRequestSchema],
    },
  },
  embeddedSchemaOptions,
)

// Embedded within Character.useCases.
export const UseCaseSchema = new Schema<CustomUseCase>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    screens: [UseCaseScreenSchema],
  },
  embeddedSchemaOptions,
)
