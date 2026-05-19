import { Schema, model } from 'mongoose'

export type OobInvitationKind = 'connection' | 'proof'

export interface OobInvitationDocument {
  _id: string
  invitation: Record<string, unknown>
  inviMsgId?: string
  kind: OobInvitationKind
  expiresAt: Date
}

const OobInvitationSchema = new Schema<OobInvitationDocument>(
  {
    _id: { type: String, required: true },
    invitation: { type: Schema.Types.Mixed, required: true },
    inviMsgId: { type: String },
    kind: { type: String, enum: ['connection', 'proof'], required: true },
    expiresAt: { type: Date, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

OobInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const OobInvitationModel = model<OobInvitationDocument>('OobInvitation', OobInvitationSchema)
