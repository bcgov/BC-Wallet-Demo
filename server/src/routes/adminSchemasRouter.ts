import type { Request, Response } from 'express'

import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { SchemaModel } from '../db/models/Schema'
import { requireRole } from '../middleware/requireAdmin'
import logger from '../utils/logger'
import { tractionRequest, retryWithExponentialBackoff } from '../utils/tractionHelper'

const router = Router()

const getLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many schema creation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * GET /admin/schemas
 * Get all anoncreds schemas from MongoDB.
 */
router.get('/schemas', getLimiter, requireRole(['admin', 'creator']), async (_req: Request, res: Response) => {
  logger.debug('Admin: fetching anoncreds schemas from MongoDB')
  try {
    const schemas = await SchemaModel.find().lean()
    res.json(schemas)
  } catch (error) {
    logger.error(error, 'Error fetching schemas from MongoDB')
    res.status(500).json({ error: 'Failed to fetch schemas from MongoDB' })
  }
})

/**
 * POST /admin/schemas
 * Create a new anoncreds schema in Traction and save to MongoDB.
 */
router.post('/schemas', createLimiter, requireRole(['admin', 'creator']), async (req: Request, res: Response) => {
  logger.debug('Admin: creating anoncreds schema and cred def in Traction')
  try {
    const issuerDid = (await tractionRequest.get('/wallet/did/public')).data.result.did
    const createSchemaPayload = {
      name: req.body.name,
      version: req.body.version,
      attrNames: req.body.attrNames,
      issuerId: issuerDid,
    }
    logger.debug({ createSchemaPayload }, 'Creating schema with payload')
    const response = await tractionRequest.post('/anoncreds/schema', { schema: createSchemaPayload })
    const credDefResponse = await retryWithExponentialBackoff(
      () =>
        tractionRequest.post('/anoncreds/credential-definition', {
          credential_definition: {
            issuerId: issuerDid,
            schemaId: response.data.schema_state.schema_id,
            tag: response.data.schema_state.schema.name,
          },
          options: {
            support_revocation: true,
            revocation_registry_size: 3000,
          },
        }),
      3,
      1000,
    )
    // Save schema to MongoDB
    const schemaId = response.data.schema_state.schema_id
    const credDefId = credDefResponse.data.credential_definition_state.credential_definition_id
    await SchemaModel.updateOne(
      { _id: schemaId },
      {
        $set: {
          name: req.body.name,
          version: req.body.version,
          attrNames: req.body.attrNames,
          credDefId,
        },
      },
      { upsert: true },
    )
    res.status(201).json(response.data)
  } catch (error) {
    logger.error(error, 'Error creating schema and cred def in Traction')
    res.status(500).json({ error: `Failed to create schema and cred def in Traction: ${error}` })
  }
})

export default router
