import type { Request, Response } from 'express'

import { findOobInvitation } from '../services/oobInvitationStore'
import { isShortInvitationUrlEnabled } from '../utils/oobInvitation'
import logger from '../utils/logger'

export async function serveOobInvitation(req: Request, res: Response): Promise<Response> {
  if (!isShortInvitationUrlEnabled()) {
    return res.status(404).json({ error: 'Short invitation URLs are disabled' })
  }
  const oobId = decodeURIComponent(req.params.code)
  logger.debug({ oobId }, 'Serving OOB invitation for QR resolve')

  const doc = await findOobInvitation(oobId)
  if (!doc) {
    return res.status(404).json({ error: 'Invitation not found' })
  }
  if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) {
    return res.status(410).json({ error: 'Invitation expired' })
  }

  res.setHeader('Content-Type', 'application/json')
  return res.status(200).send(doc.invitation)
}
