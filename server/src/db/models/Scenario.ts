import type { CredentialRequest, Predicate, Scenario, ScenarioScreen } from '../../content/types'

import { Schema } from 'mongoose'

import { embeddedSchemaOptions } from '../baseSchema'

// Extracted into its own schema so Mongoose keeps the parent path undefined
// when verifier is not provided. An inline nested object would be initialised
// to {} and trigger the required validation on name even for screens that have
// no verifier.
const VerifierSchema = new Schema<{ name: string; icon?: string }>(
  { name: { type: String, required: true }, icon: String },
  embeddedSchemaOptions,
)

// predicates.value allows runtime functions in types.ts (e.g. to compute the
// current date at issuance), but functions cannot be persisted in MongoDB.
// Callers must resolve any function values before saving a document.
type PersistedPredicate = Omit<Predicate, 'value'> & { value?: string | number }

type PersistedCredentialRequest = Omit<CredentialRequest, 'predicates'> & {
  predicates?: PersistedPredicate[]
}

const PredicateSchema = new Schema<PersistedPredicate>(
  {
    name: String,
    type: String,
    value: {
      type: Schema.Types.Mixed,
      validate: {
        validator: (value: unknown) => value === undefined || typeof value === 'string' || typeof value === 'number',
        message: 'Predicate value must be a string or number',
      },
    },
  },
  embeddedSchemaOptions,
)

// A single identifier restricts to one schema/creddef; an array expresses an OR of alternatives
const idOrIdListValidator = {
  validator: (value: unknown) =>
    value === undefined ||
    (typeof value === 'string' && value.trim().length > 0) ||
    (Array.isArray(value) &&
      value.length > 0 &&
      value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)),
  message: 'Value must be a non-empty string or an array of non-empty strings',
}

const CredentialRequestSchema = new Schema<PersistedCredentialRequest>(
  {
    name: { type: String, required: true },
    icon: String,
    schema_id: { type: Schema.Types.Mixed, validate: idOrIdListValidator },
    cred_def_id: { type: Schema.Types.Mixed, validate: idOrIdListValidator },
    cred_id: String,
    predicates: [PredicateSchema],
    properties: [String],
    nonRevoked: {
      to: Schema.Types.Mixed,
      from: Schema.Types.Mixed,
    },
  },
  embeddedSchemaOptions,
)

// Same reasoning as VerifierSchema -- sub-schema keeps requestOptions undefined
// when absent, so required fields on title/text only fire when it is provided.
const RequestOptionsSchema = new Schema<{
  name: string
  text: string
  requestedCredentials: PersistedCredentialRequest[]
}>(
  {
    name: { type: String, required: true },
    text: { type: String, required: true },
    requestedCredentials: [CredentialRequestSchema],
  },
  embeddedSchemaOptions,
)

const ScenarioScreenSchema = new Schema<ScenarioScreen>(
  {
    screenId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    image: String,
    verifier: VerifierSchema,
    requestOptions: RequestOptionsSchema,
  },
  embeddedSchemaOptions,
)

// Embedded within Character.scenarios.
export const ScenarioSchema = new Schema<Scenario>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    screens: [ScenarioScreenSchema],
  },
  embeddedSchemaOptions,
)
