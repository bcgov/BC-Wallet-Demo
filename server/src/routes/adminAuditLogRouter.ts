import type { AuditAction, AuditResourceType } from '../db/models/AuditLog'
import type { Request, Response } from 'express'

import { Router } from 'express'
import { Container } from 'typedi'

import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from '../db/models/AuditLog'
import { requireRole } from '../middleware/requireAdmin'
import { AuditLogService } from '../services/AuditLogService'
import logger from '../utils/logger'

const router = Router()

const auditLogService = Container.get(AuditLogService)

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

function parseCommaSeparated<T extends string>(raw: unknown, allowed: readonly T[]): T[] | undefined {
  if (!raw) return undefined
  const values = String(raw)
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is T => (allowed as readonly string[]).includes(v))
  return values.length ? values : undefined
}

/**
 * GET /admin/audit-log
 * List audit log entries with optional filtering and pagination.
 * Requires: admin role
 *
 * Query params:
 *   page, limit, startDate, endDate,
 *   action (comma-separated), resource_type (comma-separated), user_id
 */
router.get('/', requireRole(['admin']), async (req: Request, res: Response) => {
  logger.debug({ query: req.query }, 'Admin: list audit log')

  try {
    const parsedPage = parseInt(String(req.query.page ?? ''), 10)
    const page = Math.max(1, isNaN(parsedPage) ? 1 : parsedPage)

    const parsedLimit = parseInt(String(req.query.limit ?? ''), 10)
    const rawLimit = isNaN(parsedLimit) ? DEFAULT_LIMIT : parsedLimit
    const limit = Math.min(Math.max(1, rawLimit), MAX_LIMIT)

    const startDate = req.query.startDate ? new Date(String(req.query.startDate)) : undefined
    const endDate = req.query.endDate ? new Date(String(req.query.endDate)) : undefined

    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid startDate' })
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid endDate' })
    }

    const actions = parseCommaSeparated<AuditAction>(req.query.action, AUDIT_ACTIONS)
    const resourceTypes = parseCommaSeparated<AuditResourceType>(req.query.resource_type, AUDIT_RESOURCE_TYPES)
    const userId = req.query.user_id ? String(req.query.user_id) : undefined

    const result = await auditLogService.query({ page, limit, startDate, endDate, actions, resourceTypes, userId })
    res.json(result)
  } catch (error) {
    logger.error(error, 'Error fetching audit log')
    res.status(500).json({ error: 'Failed to fetch audit log' })
  }
})

export default router
