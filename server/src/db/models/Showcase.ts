import type {
  Credential,
  IntroductionStep,
  Persona,
  ProgressBarStep,
  RevocationInfoItem,
  Showcase,
} from '../../content/types'
import type { Types } from 'mongoose'

import { Schema, model } from 'mongoose'
import fs from 'node:fs/promises'

import { AttributeSchema, baseSchemaOptions, embeddedSchemaOptions } from '../baseSchema'

import { AssetModel } from './Asset'
import { ScenarioSchema } from './Scenario'

// Maps to Credential interface (credentials issued during onboarding steps).
// Not to be confused with CredentialRequest, which is for proof use case screens.
const CredentialSchema = new Schema<Credential>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    version: { type: String, required: true },
    // Use shared AttributeSchema so name is required consistently.
    attributes: [AttributeSchema],
  },
  embeddedSchemaOptions,
)

// Maps to IntroductionStep interface.
const IntroductionStepSchema = new Schema<IntroductionStep>(
  {
    screenId: { type: String, required: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
    image: String,
    issuer_name: String,
    credentials: [CredentialSchema],
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
    name: { type: String, required: true },
    // type is the public slug (e.g. "Student"); uniqueness enforced via ShowcaseSchema index below.
    type: { type: String, required: true },
    image: { type: String, required: true },
  },
  embeddedSchemaOptions,
)

// Maps to Showcase interface. Top-level collection; persona.type is the public
// slug (e.g. "Student") and must be unique across all showcases.
const ShowcaseSchema = new Schema<Showcase>(
  {
    name: { type: String, required: true },
    persona: { type: PersonaSchema, required: true },
    hidden: { type: Boolean, default: false },
    description: String,
    // required + default to match types.ts where both fields are non-optional.
    progressBar: { type: [ProgressBarStepSchema], required: true, default: [] },
    introduction: { type: [IntroductionStepSchema], required: true, default: [] },
    scenarios: [ScenarioSchema],
    revocationInfo: [RevocationInfoItemSchema],
  },
  baseSchemaOptions,
)

// Enforce uniqueness on persona.type so each showcase slug is distinct.
ShowcaseSchema.index({ 'persona.type': 1 }, { unique: true })

// Removes all asset documents and their files from disk for the given showcase.
// Shared across deletion hooks to avoid duplication.
// ENOENT is ignored (file already gone); all other errors propagate.
// Note: deleteMany on ShowcaseModel is intentionally not hooked -- bulk deletes
// that bypass middleware must handle cascade themselves.
async function cascadeDeleteAssets(showcaseId: Types.ObjectId) {
  const assets = await AssetModel.find({ showcase_id: showcaseId }).select('path')
  await Promise.all(
    assets.map((a) =>
      fs.unlink(a.path).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') throw e
      }),
    ),
  )
  await AssetModel.deleteMany({ showcase_id: showcaseId })
}

// Document-level: doc.deleteOne()
ShowcaseSchema.post('deleteOne', { document: true, query: false }, async function () {
  await cascadeDeleteAssets(this._id as Types.ObjectId)
})

// Query-level: ShowcaseModel.deleteOne({ ... })
// Must be pre so the document can be found before it is deleted.
ShowcaseSchema.pre('deleteOne', { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).select('_id')
  if (doc) await cascadeDeleteAssets(doc._id as Types.ObjectId)
})

// findByIdAndDelete / findOneAndDelete
ShowcaseSchema.post('findOneAndDelete', async (doc) => {
  if (!doc) return
  await cascadeDeleteAssets(doc._id as Types.ObjectId)
})

export const ShowcaseModel = model<Showcase>('Showcase', ShowcaseSchema)
