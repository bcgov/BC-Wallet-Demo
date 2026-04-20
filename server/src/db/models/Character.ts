import type {
  Credential,
  CustomCharacter,
  OnboardingStep,
  ProgressBarStep,
  RevocationInfoItem,
} from '../../content/types'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions, embeddedSchemaOptions } from '../baseSchema'

import { UseCaseSchema } from './UseCase'

// Maps to Credential interface (credentials issued during onboarding steps).
// Not to be confused with CredentialRequest, which is for proof use case screens.
const CredentialSchema = new Schema<Credential>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    version: { type: String, required: true },
    attributes: [{ name: String, value: String }],
  },
  embeddedSchemaOptions
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
  embeddedSchemaOptions
)

// Maps to ProgressBarStep interface.
const ProgressBarStepSchema = new Schema<ProgressBarStep>(
  {
    name: { type: String, required: true },
    onboardingStep: { type: String, required: true },
    iconLight: { type: String, required: true },
    iconDark: { type: String, required: true },
  },
  embeddedSchemaOptions
)

// Maps to RevocationInfoItem interface.
const RevocationInfoItemSchema = new Schema<RevocationInfoItem>(
  {
    credentialName: { type: String, required: true },
    credentialIcon: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
  },
  embeddedSchemaOptions
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
    progressBar: [ProgressBarStepSchema],
    onboarding: [OnboardingStepSchema],
    useCases: [UseCaseSchema],
    revocationInfo: [RevocationInfoItemSchema],
  },
  baseSchemaOptions
)

export const CharacterModel = model<CustomCharacter>('Character', CharacterSchema)
