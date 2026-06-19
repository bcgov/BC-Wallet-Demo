import type { Request, Response } from 'express'

import { Router } from 'express'
import { Container } from 'typedi'

import { DidModel } from '../db/models/Did'
import { SchemaModel } from '../db/models/Schema'
import { requireRole } from '../middleware/requireAdmin'
import { AuditLogService } from '../services/AuditLogService'
import { TractionRegistrationService } from '../services/TractionRegistrationService'
import logger from '../utils/logger'
import { defaultRateLimiter, createRateLimiter } from '../utils/rateLimiter'

const auditLogService = Container.get(AuditLogService)
const tractionRegistrationService = Container.get(TractionRegistrationService)

const router = Router()

const transformSchemaResponse = async (schema: any) => {
  const did = await DidModel.findById(schema.did).lean()
  return {
    ...schema,
    id: schema._id, // Expose _id as id for frontend consistency
    did,
  }
}

/**
 * GET /admin/schemas
 * Get all anoncreds schemas from MongoDB.
 */
router.get('/schemas', defaultRateLimiter, requireRole(['admin', 'creator']), async (_req: Request, res: Response) => {
  logger.debug('Admin: fetching anoncreds schemas from MongoDB')
  try {
    const schemas = await SchemaModel.find().lean()
    const response = await Promise.all(schemas.map(async (schema) => transformSchemaResponse(schema)))
    res.json(response)
  } catch (error) {
    logger.error(error, 'Error fetching schemas from MongoDB')
    res.status(500).json({ error: 'Failed to fetch schemas from MongoDB' })
  }
})

/**
 * GET /admin/schemas/:id
 * Get a single anoncreds schema from MongoDB by ID.
 */
router.get(
  '/schemas/:id',
  defaultRateLimiter,
  requireRole(['admin', 'creator']),
  async (req: Request, res: Response) => {
    logger.debug({ id: req.params.id }, 'Admin: fetching schema by ID from MongoDB')
    try {
      const schema = await SchemaModel.findById(req.params.id).lean()
      if (!schema) {
        res.status(404).json({ error: 'Schema not found' })
        return
      }
      const response = await transformSchemaResponse(schema)
      res.json(response)
    } catch (error) {
      logger.error(error, 'Error fetching schema from MongoDB')
      res.status(500).json({ error: 'Failed to fetch schema from MongoDB' })
    }
  },
)

/**
 * POST /admin/schemas
 * Create a new anoncreds schema in Traction and save to MongoDB.
 */
router.post('/schemas', createRateLimiter, requireRole(['admin', 'creator']), async (req: Request, res: Response) => {
  logger.debug('Admin: creating anoncreds schema and cred def in Traction')
  try {
    const attrNames = req.body.attributes.map((a: any) => a.name)
    const schemaId = await tractionRegistrationService.registerSchema(
      req.body.name,
      req.body.version,
      attrNames,
      req.body.did,
    )
    const credDefId = await tractionRegistrationService.registerCredentialDefinition(
      req.body.did,
      schemaId,
      req.body.name,
    )
    await SchemaModel.updateOne(
      { _id: schemaId },
      {
        $set: {
          name: req.body.name,
          version: req.body.version,
          attributes: req.body.attributes,
          credDefId,
          did: req.body.did,
        },
      },
      { upsert: true },
    )
    // Return the saved schema document from MongoDB for consistency with GET endpoint
    const savedSchema = await SchemaModel.findById(schemaId)
    res.status(201).json(savedSchema)
    // Best-effort audit: writes after response sent, may be lost on crash/shutdown.
    void Promise.resolve()
      .then(() =>
        auditLogService.log({
          user_id: req.auth?.sub ?? 'unknown',
          action: 'created',
          resource_type: 'schema',
          resource_id: schemaId,
          details: { name: req.body.name, version: req.body.version },
        }),
      )
      .catch((err: unknown) => logger.error(err, 'Audit log: failed to write schema created event'))
  } catch (error) {
    logger.error(error, 'Error creating schema and cred def in Traction')
    const msg = error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: `Failed to create schema and cred def in Traction: ${msg}` })
  }
})

export default router
