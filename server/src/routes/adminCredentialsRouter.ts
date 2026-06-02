import type { Request, Response } from 'express'

import { Router } from 'express'
import { BadRequestError, NotFoundError } from 'routing-controllers'
import { Container } from 'typedi'

import { CredentialController } from '../controllers/CredentialController'
import { AdminCredentialController } from '../controllers/admin/AdminCredentialController'
import { requireRole } from '../middleware/requireAdmin'
import { AuditLogService } from '../services/AuditLogService'
import logger from '../utils/logger'

const router = Router()

const credentialController = Container.get(CredentialController)
const adminCredentialController = Container.get(AdminCredentialController)
const auditLogService = Container.get(AuditLogService)

/**
 * GET /admin/credentials
 * List all credentials. Triggers a lazy Traction sync if TTL has expired.
 * Supports ?status=active|retired and ?schema_name= filters.
 * Requires: admin or creator or viewer role
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), async (req: Request, res: Response) => {
  logger.debug('Admin: list credentials')
  try {
    let credentials = await credentialController.getAllCredentials()

    // Local filtering
    const { status, schema_name } = req.query
    if (status && typeof status === 'string') {
      credentials = credentials.filter((c: any) => c.status === status)
    }
    if (schema_name && typeof schema_name === 'string') {
      credentials = credentials.filter((c: any) => c.name === schema_name)
    }

    res.json(credentials)
  } catch (error) {
    logger.error(error, 'Error fetching credentials')
    res.status(500).json({ error: 'Failed to fetch credentials' })
  }
})

/**
 * GET /admin/credentials/:id
 * Get a single credential by id.
 * Requires: admin or creator or viewer role
 */
router.get('/:id', requireRole(['admin', 'creator', 'viewer']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: get credential')
  try {
    const credential = await credentialController.getCredentialById(req.params.id)
    res.json(credential)
  } catch (error) {
    logger.error(error, 'Error fetching credential')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Credential not found' })
    } else {
      res.status(500).json({ error: 'Failed to fetch credential' })
    }
  }
})

/**
 * POST /admin/credentials
 * Create a new credential.
 * Requires: admin role
 */
router.post('/', requireRole(['admin']), async (req: Request, res: Response) => {
  logger.debug({ body: req.body }, 'Admin: create credential')
  try {
    const credential = await adminCredentialController.createCredential(req.body)
    res.status(201).json(credential)
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'registered',
          resource_type: 'credential',
          resource_id: credential.id,
          details: { name: credential.name },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write credential registered event'))
  } catch (error) {
    logger.error(error, 'Error creating credential')
    res.status(500).json({ error: 'Failed to create credential' })
  }
})

/**
 * PUT /admin/credentials/:id
 * Update a credential. Ledger-registered credentials may only update showcase fields.
 * Requires: admin role
 */
router.put('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id, body: req.body }, 'Admin: update credential')
  try {
    const credential = await adminCredentialController.updateCredential(req.params.id, req.body)
    res.json(credential)
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'updated',
          resource_type: 'credential',
          resource_id: req.params.id,
          details: { name: req.body?.name },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write credential updated event'))
  } catch (error) {
    logger.error(error, 'Error updating credential')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Credential not found' })
    } else if (error instanceof BadRequestError) {
      res.status(400).json({ error: (error as Error).message })
    } else {
      res.status(500).json({ error: 'Failed to update credential' })
    }
  }
})

/**
 * DELETE /admin/credentials/:id
 * Soft-delete: marks credential as retired. Document is preserved.
 * Requires: admin role
 */
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: retire credential')
  try {
    const credential = await adminCredentialController.deleteCredential(req.params.id)
    res.json(credential)
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'retired',
          resource_type: 'credential',
          resource_id: req.params.id,
          details: { id: req.params.id },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write credential retired event'))
  } catch (error) {
    logger.error(error, 'Error retiring credential')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Credential not found' })
    } else {
      res.status(500).json({ error: 'Failed to retire credential' })
    }
  }
})

export default router
