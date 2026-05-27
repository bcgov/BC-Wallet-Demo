import { Schema, model } from 'mongoose'

import { baseSchemaOptions } from '../baseSchema'

export interface Asset {
  filename: string
  mime_type: string
  size_bytes: number
  type?: string
}

const AssetSchema = new Schema<Asset>(
  {
    filename: { type: String, required: true },
    mime_type: { type: String, required: true },
    size_bytes: { type: Number, required: true },
    // Optional category tag for filtering (e.g. 'icon', 'screen', 'persona').
    type: { type: String, required: false, index: true },
  },
  baseSchemaOptions,
)

export const AssetModel = model<Asset>('Asset', AssetSchema)
