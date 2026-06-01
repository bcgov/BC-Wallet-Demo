import { BadRequestError, Body, Delete, JsonController, NotFoundError, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'

import { Credential, CreateCredentialInput } from '../../content/types'
import { CredentialModel, LeanCredentialDoc } from '../../db/models/Credential'
import { toCredentialResponse } from '../../utils/credentialMapper'
import logger from '../../utils/logger'
import { tractionRequest } from '../../utils/tractionHelper'

const SYNC_TTL_MS = 5 * 60 * 1000 // 5 minutes
const LEDGER_PROPAGATION_MS = 5000 // wait after schema creation before creating cred def

// Fields that are locked once a credential is registered on the ledger.
// Only showcase-specific fields (icon, attributes values, status) remain editable.
const LEDGER_LOCKED_FIELDS = ['name', 'version', 'schema_id', 'cred_def_id'] as const

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

async function resolveSchemaId(cred: LeanCredentialDoc): Promise<string> {
  if (cred.schema_id) return cred.schema_id

  const { data } = await tractionRequest.get('/schemas/created', {
    params: { schema_name: cred.name, schema_version: cred.version },
  })
  const existing: string[] = data.schema_ids ?? []
  if (existing.length > 1) {
    logger.warn(
      { credentialId: cred._id, count: existing.length, schema_ids: existing },
      'Multiple schemas found for credential; using first',
    )
  }
  if (existing.length > 0) return existing[0]

  const { data: created } = await tractionRequest.post('/schemas', {
    attributes: cred.attributes.map((a) => a.name),
    schema_name: cred.name,
    schema_version: cred.version,
  })
  await new Promise((r) => setTimeout(r, LEDGER_PROPAGATION_MS))
  return created.sent.schema_id
}

async function resolveCredDefId(schemaId: string, cred: LeanCredentialDoc): Promise<string> {
  if (cred.cred_def_id) return cred.cred_def_id

  const { data } = await tractionRequest.get('/credential-definitions/created', {
    params: { schema_id: schemaId },
  })
  const existing: string[] = data.credential_definition_ids ?? []
  if (existing.length > 0) return existing[0]

  const { data: created } = await tractionRequest.post('/credential-definitions', {
    revocation_registry_size: 25,
    schema_id: schemaId,
    support_revocation: true,
    tag: cred.name,
  })
  return created.sent.credential_definition_id
}

async function registerWithTraction(cred: LeanCredentialDoc): Promise<boolean> {
  const schemaId = await resolveSchemaId(cred)
  const credDefId = await resolveCredDefId(schemaId, cred)

  const updates = {
    ...(cred.schema_id ? {} : { schema_id: schemaId }),
    ...(!cred.cred_def_id ? { cred_def_id: credDefId } : {}),
  }

  if (!Object.keys(updates).length) return false

  await CredentialModel.findByIdAndUpdate(cred._id, updates)
  logger.debug({ credentialId: cred._id, ...updates }, 'Registered credential with Traction')
  return true
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
  public async createCredential(@Body() body: CreateCredentialInput) {
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

        // Reject attribute structural changes -- names and count are locked on ledger
        if (body.attributes) {
          const existingNames = existing.attributes.map((a) => a.name)
          const incomingNames = body.attributes.map((a) => a.name)
          const structureChanged =
            incomingNames.length !== existingNames.length || incomingNames.some((name, i) => name !== existingNames[i])
          if (structureChanged) {
            logger.warn(
              { credentialId },
              'Attempt to change attribute structure of ledger-registered credential rejected',
            )
            throw new BadRequestError(
              `Cannot change attribute names or count after registration. Only attribute values may be updated.`,
            )
          }
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
   * For each active credential missing a schema_id or cred_def_id: create the schema
   * and credential definition in Traction if they do not already exist, then write the
   * resulting IDs back to the local document. Updates lastSyncTimestamp on success.
   */
  public async syncCredentials(): Promise<{
    updated: number
    failed: number
    total: number
  }> {
    logger.info('Syncing local credentials to Traction')

    const credentials = await CredentialModel.find({
      status: { $ne: 'retired' },
      $or: [{ schema_id: { $exists: false } }, { schema_id: '' }, { cred_def_id: { $exists: false } }],
    }).lean<LeanCredentialDoc[]>()

    const results = await Promise.allSettled(credentials.map(registerWithTraction))

    let updated = 0
    let failed = 0
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) updated++
      else if (result.status === 'rejected') {
        failed++
        logger.error({ err: result.reason }, 'Failed to register credential with Traction')
      }
    }

    this.lastSyncTimestamp = Date.now()
    logger.info({ updated, failed, total: credentials.length }, 'Traction sync complete')
    return { updated, failed, total: credentials.length }
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
