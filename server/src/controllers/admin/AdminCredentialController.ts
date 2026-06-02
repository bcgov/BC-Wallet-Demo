import { BadRequestError, Body, Delete, JsonController, NotFoundError, Param, Post, Put } from 'routing-controllers'
import { Service } from 'typedi'

import { Credential, CreateCredentialInput } from '../../content/types'
import { CredentialModel, LeanCredentialDoc } from '../../db/models/Credential'
import { toCredentialResponse } from '../../utils/credentialMapper'
import logger from '../../utils/logger'

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
}
