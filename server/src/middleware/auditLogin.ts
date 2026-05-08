import type { NextFunction, Request, Response } from 'express'

import { Container } from 'typedi'

import { AuditLogService } from '../services/AuditLogService'
import logger from '../utils/logger'

const WINDOW_MS = 30 * 60 * 1000 // 30 minutes
const PRUNE_AFTER_MS = 60 * 60 * 1000 // 1 hour

// user_id -> timestamp of last logged login event
const lastLoginSeen = new Map<string, number>()

// Deleting from a Map during for...of is safe per ES spec (ECMA-262 sec-createmapitera).
function pruneStale(): void {
  const cutoff = Date.now() - PRUNE_AFTER_MS
  for (const [userId, ts] of lastLoginSeen) {
    if (ts < cutoff) lastLoginSeen.delete(userId)
  }
}

export function auditLoginMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const auth = req.auth
  if (!auth?.sub) {
    next()
    return
  }

  const userId = auth.sub
  const now = Date.now()
  const lastSeen = lastLoginSeen.get(userId)

  pruneStale()

  if (lastSeen === undefined || now - lastSeen > WINDOW_MS) {
    lastLoginSeen.set(userId, now)

    const auditLogService = Container.get(AuditLogService)
    auditLogService
      .log({
        user_id: userId,
        action: 'login',
        resource_type: 'user',
        details: { username: auth.preferred_username },
      })
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write login event'))
  }

  next()
}
