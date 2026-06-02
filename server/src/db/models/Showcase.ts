import type {
  IntroductionStep,
  Persona,
  ProgressBarStep,
  RevocationInfoItem,
  Showcase,
  ShowcaseStatus,
} from '../../content/types'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions, embeddedSchemaOptions } from '../baseSchema'

import { ScenarioSchema } from './Scenario'

// Maps to IntroductionStep interface.
const IntroductionStepSchema = new Schema<IntroductionStep>(
  {
    screenId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    image: String,
    issuer_name: String,
    credentials: [String],
  },
  embeddedSchemaOptions,
)

// Maps to ProgressBarStep interface.
const ProgressBarStepSchema = new Schema<ProgressBarStep>(
  {
    name: { type: String, required: true },
    introductionStep: { type: String, required: true },
    iconLight: { type: String, required: true },
    iconDark: { type: String, required: true },
  },
  embeddedSchemaOptions,
)

// Maps to RevocationInfoItem interface.
const RevocationInfoItemSchema = new Schema<RevocationInfoItem>(
  {
    credentialName: { type: String, required: true },
    credentialIcon: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  embeddedSchemaOptions,
)

// Maps to Persona interface. Holds the character identity for this showcase.
const PersonaSchema = new Schema<Persona>(
  {
    name: { type: String, required: false },
    // type is the public slug (e.g. "Student"); uniqueness enforced via ShowcaseSchema index below.
    type: { type: String, required: false },
    image: { type: String, required: false },
  },
  embeddedSchemaOptions,
)

// Maps to Showcase interface. Top-level collection; persona.type is the public
// slug (e.g. "Student") and must be unique across all showcases when present.
// Persona itself is optional to allow showcases without character identity.
const ShowcaseSchema = new Schema<Showcase>(
  {
    name: { type: String, required: true },
    persona: { type: PersonaSchema, required: false },
    status: { type: String, enum: ['active', 'hidden', 'pending'] satisfies ShowcaseStatus[], default: 'active' },
    description: String,
    credentials: { type: [String], required: true, default: [] },
    // required + default to match types.ts where both fields are non-optional.
    progressBar: { type: [ProgressBarStepSchema], required: true, default: [] },
    introduction: { type: [IntroductionStepSchema], required: true, default: [] },
    scenarios: [ScenarioSchema],
    revocationInfo: [RevocationInfoItemSchema],
    deleted_at: { type: Date, default: null },
  },
  baseSchemaOptions,
)

// Enforce uniqueness on name for admin operations that key off showcase name.
ShowcaseSchema.index({ name: 1 }, { unique: true })

// Enforce uniqueness on persona.type so each showcase slug is distinct.
// Use sparse index so showcases without persona don't conflict.
ShowcaseSchema.index({ 'persona.type': 1 }, { unique: true, sparse: true })

// Efficient filtering for active (non-deleted) showcase queries.
ShowcaseSchema.index({ deleted_at: 1, status: 1 })

export const ShowcaseModel = model<Showcase>('Showcase', ShowcaseSchema)
