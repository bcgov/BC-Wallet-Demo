import type { Did as DidType } from '../../content/types'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

/** Shape returned by DidModel queries with .lean(). Uses auto-generated UUID _id. */
export interface LeanDidDoc {
  _id: string
  did: string
  method: string
}

// DID documents use auto-generated UUID _id.
// baseSchemaOptions exposes it as `id` in JSON output via the virtuals transform.
const DidSchema = new Schema(
  {
    _id: { type: String, required: true },
    did: { type: String, required: true, unique: true },
    method: { type: String, required: true },
  },
  baseSchemaOptions,
)

export const DidModel = model<DidType>('Did', DidSchema)
