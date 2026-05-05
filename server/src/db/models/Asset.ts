import type { Types } from 'mongoose'

import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

export interface Asset {
  showcase_id: Types.ObjectId
  filename: string
  path: string
  mime_type: string
  size_bytes: number
}

const AssetSchema = new Schema<Asset>(
  {
    // Reference to the owning Character; indexed for efficient per-character listing.
    showcase_id: { type: Schema.Types.ObjectId, ref: 'Character', required: true, index: true },
    filename: { type: String, required: true },
    // Filesystem path where the file is stored on disk.
    path: { type: String, required: true },
    mime_type: { type: String, required: true },
    size_bytes: { type: Number, required: true },
  },
  baseSchemaOptions,
)

export const AssetModel = model<Asset>('Asset', AssetSchema)
