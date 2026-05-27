import type { OobInvitationKind } from '../db/models/OobInvitation'
import type { OobInvitationMessage } from '../utils/oobInvitation'

import { OobInvitationModel } from '../db/models/OobInvitation'

const defaultTtlSeconds = 86_400

function invitationTtlMs(): number {
  const raw = process.env.INVITATION_SHORT_LINK_TTL_SECONDS
  const seconds = raw ? Number(raw) : defaultTtlSeconds
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return defaultTtlSeconds * 1000
  }
  return seconds * 1000
}

export async function persistOobInvitation(params: {
  oobId: string
  invitation: OobInvitationMessage
  inviMsgId?: string
  kind?: OobInvitationKind
}): Promise<void> {
  const expiresAt = new Date(Date.now() + invitationTtlMs())
  await OobInvitationModel.findByIdAndUpdate(
    params.oobId,
    {
      invitation: params.invitation,
      inviMsgId: params.inviMsgId,
      kind: params.kind ?? 'connection',
      expiresAt,
    },
    { upsert: true },
  )
}

export async function findOobInvitation(oobId: string) {
  return OobInvitationModel.findById(oobId).lean()
}
