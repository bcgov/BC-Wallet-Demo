import type { Request, Response } from 'express'

import { Router } from 'express'
import { NotFoundError } from 'routing-controllers'
import { Container } from 'typedi'

import { ShowcaseController } from '../controllers/ShowcaseController'
import { AdminShowcaseController } from '../controllers/admin/AdminShowcaseController'
import { requireRole } from '../middleware/requireAdmin'
import { AuditLogService } from '../services/AuditLogService'
import logger from '../utils/logger'

const router = Router()

const showcaseController = Container.get(ShowcaseController)
const adminShowcaseController = Container.get(AdminShowcaseController)
const auditLogService = Container.get(AuditLogService)

/**
 * GET /admin/showcases
 * List all showcases.
 */
router.get('/', requireRole(['admin', 'creator', 'viewer']), async (_req: Request, res: Response) => {
  logger.debug('Admin: list showcases')
  try {
    const showcases = await showcaseController.getShowcases()
    res.json(showcases)
  } catch (error) {
    logger.error(error, 'Error fetching showcases')
    res.status(500).json({ error: 'Failed to fetch showcases' })
  }
})

/**
 * GET /admin/showcases/:id
 * Get a single showcase by id.
 */
router.get('/:id', requireRole(['admin', 'creator', 'viewer']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: get showcase')
  try {
    const showcase = await showcaseController.getShowcaseById(req.params.id)
    res.json(showcase)
  } catch (error) {
    logger.error(error, 'Error fetching showcase')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Showcase not found' })
    } else {
      res.status(500).json({ error: 'Failed to fetch showcase' })
    }
  }
})

/**
 * POST /admin/showcases
 * Create a new showcase.
 */
router.post('/', requireRole(['admin', 'creator']), async (req: Request, res: Response) => {
  logger.debug({ body: req.body }, 'Admin: create showcase')
  try {
    const showcase = await adminShowcaseController.createShowcase(req.body)
    res.status(201).json(showcase)
    // Best-effort audit: writes after response sent, may be lost on crash/shutdown.
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'created',
          resource_type: 'showcase',
          resource_id: String(showcase._id ?? ''),
          details: { name: showcase.name },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write showcase created event'))
  } catch (error) {
    logger.error(error, 'Error creating showcase')
    res.status(500).json({ error: 'Failed to create showcase' })
  }
})

/**
 * PUT /admin/showcases/:id
 * Replace a showcase.
 */
router.put('/:id', requireRole(['admin', 'creator']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id, body: req.body }, 'Admin: update showcase')
  try {
    const showcase = await adminShowcaseController.updateShowcase(req.params.id, req.body)
    res.json(showcase)
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'updated',
          resource_type: 'showcase',
          resource_id: req.params.id,
          details: { name: req.body?.name },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write showcase updated event'))
  } catch (error) {
    logger.error(error, 'Error updating showcase')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Showcase not found' })
    } else {
      res.status(500).json({ error: 'Failed to update showcase' })
    }
  }
})

/**
 * DELETE /admin/showcases/:id
 * Delete a showcase.
 */
router.delete('/:id', requireRole(['admin']), async (req: Request, res: Response) => {
  logger.debug({ id: req.params.id }, 'Admin: delete showcase')
  try {
    await adminShowcaseController.deleteShowcase(req.params.id)
    res.status(204).send()
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'deleted',
          resource_type: 'showcase',
          resource_id: req.params.id,
          details: { id: req.params.id },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write showcase deleted event'))
  } catch (error) {
    logger.error(error, 'Error deleting showcase')
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Showcase not found' })
    } else {
      res.status(500).json({ error: 'Failed to delete showcase' })
    }
  }
})

export default router
