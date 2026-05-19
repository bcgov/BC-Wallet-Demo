import type { Request } from 'express'

import type { OobInvitationKind } from '../db/models/OobInvitation'
import type { OobInvitationMessage } from '../utils/oobInvitation'

import { buildShortInvitationUrl, getOobInvitationId, isShortInvitationUrlEnabled } from '../utils/oobInvitation'
import { resolvePublicOrigin } from '../utils/publicOrigin'
import { persistOobInvitation } from './oobInvitationStore'

export type TractionOobInvitePayload = {
  invitation?: OobInvitationMessage
  invitation_url?: string
  invi_msg_id?: string
}

/** Persist invitation JSON and return the public short URL for QR codes (`GET …/i/{oobId}`). */
export async function attachShortUrlToOobInvite(
  payload: TractionOobInvitePayload,
  req: Request,
  kind: OobInvitationKind,
): Promise<string | undefined> {
  if (!isShortInvitationUrlEnabled()) {
    return undefined
  }
  const oobId = getOobInvitationId(payload.invitation)
  if (!oobId || !payload.invitation) {
    return undefined
  }
  await persistOobInvitation({
    oobId,
    invitation: payload.invitation,
    inviMsgId: payload.invi_msg_id,
    kind,
  })
  const baseRoute = process.env.BASE_ROUTE ?? ''
  return buildShortInvitationUrl(oobId, resolvePublicOrigin(req), baseRoute)
}
