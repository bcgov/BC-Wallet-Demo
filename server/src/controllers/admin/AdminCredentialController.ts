import { BadRequestError, Body, Delete, JsonController, NotFoundError, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'

import { Credential } from '../../content/types'
import { CredentialModel, LeanCredentialDoc } from '../../db/models/Credential'
import { toCredentialResponse } from '../../utils/credentialMapper'
import logger from '../../utils/logger'
import { tractionRequest } from '../../utils/tractionHelper'

const SYNC_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Fields that are locked once a credential is registered on the ledger.
// Only showcase-specific fields (icon, attributes values, status) remain editable.
const LEDGER_LOCKED_FIELDS = ['name', 'version', 'schema_id', 'cred_def_ids'] as const

function generateSlug(name: string, version: string): string {
  const nameSlug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  const versionSlug = version
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
  return `${nameSlug}-${versionSlug}`
}

@JsonController('/admin/credentials')
@Service()
export class AdminCredentialController {
  // Instance-level TTL state. TypeDI registers this as a singleton so it
  // resets only on server restart -- which is the intended behavior.
  private lastSyncTimestamp = 0

  /**
   * Create a new credential
   */
  @Post('/')
  public async createCredential(@Body() body: Credential) {
    logger.debug({ body }, 'Creating new credential')
    try {
      const credentialId = generateSlug(body.name, body.version)

      // Check if credential with this ID already exists
      const existing = await CredentialModel.findById(credentialId)
      if (existing) {
        logger.warn({ credentialId }, 'Credential with this ID already exists')
        throw new Error(`Credential "${body.name}" version "${body.version}" already exists`)
      }

      const credential = new CredentialModel({
        _id: credentialId,
        ...body,
      })
      const saved = await credential.save()
      logger.debug({ credentialId: saved._id }, 'Credential created successfully')
      return toCredentialResponse(saved.toObject() as unknown as LeanCredentialDoc)
    } catch (error) {
      logger.error(error, 'Error creating credential')
      throw error
    }
  }

  /**
   * Update a credential by id.
   * If the credential has a schema_id (registered on ledger), only showcase-specific
   * fields (icon, attributes[].value, status) may be updated.
   */
  @Put('/:credentialId')
  public async updateCredential(@Param('credentialId') credentialId: string, @Body() body: Partial<Credential>) {
    logger.debug({ credentialId, body }, 'Updating credential')
    try {
      const existing = await CredentialModel.findById(credentialId)

      if (!existing) {
        logger.warn({ credentialId }, 'Credential not found for update')
        throw new NotFoundError(`Credential with id "${credentialId}" not found.`)
      }

      // If registered on ledger, reject updates to locked fields
      if (existing.schema_id) {
        const lockedFieldsInBody = LEDGER_LOCKED_FIELDS.filter((field) => field in body)
        if (lockedFieldsInBody.length > 0) {
          logger.warn({ credentialId, lockedFieldsInBody }, 'Attempt to update ledger-locked fields rejected')
          throw new BadRequestError(
            `Cannot update ledger-locked fields: ${lockedFieldsInBody.join(', ')}. ` +
              `Only icon, attributes values, and status may be changed after registration.`,
          )
        }
      }

      const credential = await CredentialModel.findByIdAndUpdate(credentialId, body, {
        new: true,
        runValidators: true,
      }).lean<LeanCredentialDoc>()

      logger.debug({ credentialId }, 'Credential updated successfully')
      return toCredentialResponse(credential!)
    } catch (error) {
      logger.error(error, 'Error updating credential')
      throw error
    }
  }

  /**
   * Soft-delete a credential by setting status to 'retired'.
   * The document is preserved so existing showcases continue to work.
   */
  @Delete('/:credentialId')
  public async deleteCredential(@Param('credentialId') credentialId: string) {
    logger.debug({ credentialId }, 'Retiring credential')
    try {
      const credential = await CredentialModel.findByIdAndUpdate(
        credentialId,
        { status: 'retired' },
        { new: true, runValidators: true },
      ).lean<LeanCredentialDoc>()

      if (!credential) {
        logger.warn({ credentialId }, 'Credential not found for deletion')
        throw new NotFoundError(`Credential with id "${credentialId}" not found.`)
      }

      logger.debug({ credentialId }, 'Credential retired successfully')
      return toCredentialResponse(credential)
    } catch (error) {
      logger.error(error, 'Error retiring credential')
      throw error
    }
  }

  /**
   * Sync schemas and credential definitions from Traction into local MongoDB.
   * New schemas are imported; existing docs missing schema_id/cred_def_ids are updated.
   * Updates lastSyncTimestamp on success.
   */
  public async syncCredentials(filters?: { schema_name?: string; did_method?: string }): Promise<{
    imported: number
    updated: number
    total: number
  }> {
    logger.info({ filters }, 'Syncing credentials from Traction')

    const [schemasRes, credDefsRes] = await Promise.all([
      tractionRequest.get('/schema-storage'),
      tractionRequest.get('/credential-definition-storage'),
    ])

    let schemas: any[] = schemasRes.data.results
    const credDefs: any[] = credDefsRes.data.results

    // Local filtering (Traction endpoints don't support query params)
    if (filters?.schema_name) {
      schemas = schemas.filter((s) => s.schema.name === filters.schema_name)
    }
    if (filters?.did_method) {
      schemas = schemas.filter((s) => s.schema_id.startsWith(filters.did_method!))
    }

    // Build schema_id -> cred_def_id[] lookup
    const credDefMap = new Map<string, string[]>()
    for (const cd of credDefs) {
      const existing = credDefMap.get(cd.schema_id) || []
      existing.push(cd.cred_def_id)
      credDefMap.set(cd.schema_id, existing)
    }

    let imported = 0
    let updated = 0

    for (const entry of schemas) {
      const { schema, schema_id } = entry
      const credentialId = generateSlug(schema.name, schema.version)
      const matchingCredDefs = credDefMap.get(schema_id) || []

      try {
        const existing = await CredentialModel.findById(credentialId)

        if (!existing) {
          const credential = new CredentialModel({
            _id: credentialId,
            name: schema.name,
            icon: '/public/common/icon/icon-balloon-light.svg',
            version: schema.version,
            attributes: schema.attrNames.map((n: string) => ({ name: n, value: '' })),
            schema_id,
            cred_def_ids: matchingCredDefs,
            status: 'active',
          })
          await credential.save()
          imported++
          logger.debug({ credentialId, schema_id }, 'Imported credential from Traction')
        } else {
          const updates: Record<string, unknown> = {}
          if (!existing.schema_id) updates.schema_id = schema_id
          if (!existing.cred_def_ids?.length && matchingCredDefs.length) {
            updates.cred_def_ids = matchingCredDefs
          }
          if (Object.keys(updates).length) {
            await CredentialModel.findByIdAndUpdate(credentialId, updates)
            updated++
            logger.debug({ credentialId }, 'Updated credential with Traction metadata')
          }
        }
      } catch (err: any) {
        if (err?.code === 11000) {
          // Duplicate key -- another concurrent sync beat us, treat as already exists
          logger.debug({ credentialId }, 'Duplicate key on sync, skipping')
        } else {
          throw err
        }
      }
    }

    this.lastSyncTimestamp = Date.now()
    logger.info({ imported, updated, total: schemas.length }, 'Traction sync complete')
    return { imported, updated, total: schemas.length }
  }

  /**
   * Sync from Traction only if the TTL has expired.
   * Errors are caught and logged -- callers always get stale cached data rather than an error.
   */
  public async syncIfStale(): Promise<void> {
    if (Date.now() - this.lastSyncTimestamp < SYNC_TTL_MS) return
    try {
      await this.syncCredentials()
    } catch (err) {
      logger.warn(err, 'Background Traction sync failed; serving cached credentials')
    }
  }
}
