import type {
  Credential,
  CustomCharacter,
  OnboardingStep,
  ProgressBarStep,
  RevocationInfoItem,
} from '../../content/types'
import type { Types } from 'mongoose'

import { Schema, model } from 'mongoose'
import fs from 'node:fs/promises'

import { AttributeSchema, baseSchemaOptions, embeddedSchemaOptions } from '../baseSchema'

import { AssetModel } from './Asset'
import { UseCaseSchema } from './UseCase'

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

// Maps to OnboardingStep interface.
const OnboardingStepSchema = new Schema<OnboardingStep>(
  {
    screenId: { type: String, required: true },
    title: { type: String, required: true },
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
    onboardingStep: { type: String, required: true },
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
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  embeddedSchemaOptions,
)

// Maps to CustomCharacter interface. Top-level collection; type is the public
// slug (e.g. "Student") and must be unique across all showcase characters.
const CharacterSchema = new Schema<CustomCharacter>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true, unique: true },
    image: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    description: String,
    // required + default to match types.ts where both fields are non-optional.
    progressBar: { type: [ProgressBarStepSchema], required: true, default: [] },
    onboarding: { type: [OnboardingStepSchema], required: true, default: [] },
    useCases: [UseCaseSchema],
    revocationInfo: [RevocationInfoItemSchema],
  },
  baseSchemaOptions,
)

// Removes all asset documents and their files from disk for the given character.
// Shared across deletion hooks to avoid duplication.
// ENOENT is ignored (file already gone); all other errors propagate.
// Note: deleteMany on CharacterModel is intentionally not hooked -- bulk deletes
// that bypass middleware must handle cascade themselves.
async function cascadeDeleteAssets(characterId: Types.ObjectId) {
  const assets = await AssetModel.find({ showcase_id: characterId }).select('path')
  await Promise.all(
    assets.map((a) =>
      fs.unlink(a.path).catch((e: NodeJS.ErrnoException) => {
        if (e.code !== 'ENOENT') throw e
      }),
    ),
  )
  await AssetModel.deleteMany({ showcase_id: characterId })
}

// Document-level: doc.deleteOne()
CharacterSchema.post('deleteOne', { document: true, query: false }, async function () {
  await cascadeDeleteAssets(this._id as Types.ObjectId)
})

// Query-level: CharacterModel.deleteOne({ ... })
// Must be pre so the document can be found before it is deleted.
CharacterSchema.pre('deleteOne', { document: false, query: true }, async function () {
  const doc = await this.model.findOne(this.getFilter()).select('_id')
  if (doc) await cascadeDeleteAssets(doc._id as Types.ObjectId)
})

// findByIdAndDelete / findOneAndDelete
CharacterSchema.post('findOneAndDelete', async (doc) => {
  if (!doc) return
  await cascadeDeleteAssets(doc._id as Types.ObjectId)
})

export const CharacterModel = model<CustomCharacter>('Character', CharacterSchema)
