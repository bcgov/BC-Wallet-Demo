import { Body, Get, JsonController, NotFoundError, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { Credential } from '../content/types'
import { CredentialModel } from '../db/models/Credential'
import logger from '../utils/logger'
import { resolveCredentialAttributes } from '../utils/resolveMarkers'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/credentials')
@Service()
export class CredentialController {
  /**
   * Retrieve all credentials from database
   */
  @Get('/')
  public async getAllCredentials() {
    logger.debug('Fetching all credentials')
    const credentials = await CredentialModel.find().lean()
    logger.debug({ count: credentials.length }, 'Credentials fetched')
    // Map to frontend Credential type with id instead of _id
    return credentials.map((credential: any) => ({
      id: String(credential._id),
      name: credential.name,
      icon: credential.icon,
      version: credential.version,
      attributes: resolveCredentialAttributes(credential.attributes || []),
    }))
  }

  /**
   * Retrieve credential by connection id
   */
  @Get('/connId/:connId')
  public async getCredByConnId(@Param('connId') connId: string) {
    logger.debug({ connId }, 'Fetching credentials by connection id')
    const res = (
      await tractionRequest.get('/issue-credential/records', {
        params: {
          connection_id: connId,
        },
      })
    ).data

    return res
  }

  /**
   * Retrieve credential by id
   */
  @Get('/:credentialId')
  public async getCredentialById(@Param('credentialId') credentialId: string) {
    logger.debug({ credentialId }, 'Fetching credential by id')
    const credential = await CredentialModel.findById(credentialId).lean()

    if (!credential) {
      logger.warn({ credentialId }, 'Credential not found')
      throw new NotFoundError(`Credential with id "${credentialId}" not found.`)
    }

    logger.debug({ credentialId }, 'Credential found')
    // Map to frontend Credential type with id instead of _id
    return {
      id: String(credential._id),
      name: credential.name,
      icon: credential.icon,
      version: credential.version,
      attributes: resolveCredentialAttributes(credential.attributes || []),
    }
  }

  @Post('/getOrCreateCredDef')
  public async getOrCreateCredDef(@Body() credential: Credential) {
    logger.info({ name: credential.name, version: credential.version }, 'Resolving credential definition')
    const schemas = (
      await tractionRequest.get(`/anoncreds/schemas`, {
        params: { schema_name: credential.name, schema_version: credential.version },
      })
    ).data
    let schema_id = ''
    if (schemas.schema_ids.length <= 0) {
      logger.info({ name: credential.name, version: credential.version }, 'Schema not found, creating new schema')
      const schemaAttrs = credential.attributes.map((attr) => attr.name)
      const resp = (
        await tractionRequest.post(`/anoncreds/schema`, {
          schema: {
            issuerId: process.env.TRACTION_DID,
            attrNames: schemaAttrs,
            name: credential.name,
            version: credential.version,
          },
        })
      ).data
      schema_id = resp.schema_state.schema_id
      logger.info({ schema_id }, 'Schema created, waiting for ledger propagation')
      await new Promise((r) => setTimeout(r, 5000))
    } else {
      schema_id = schemas.schema_ids[0]
      logger.debug({ schema_id }, 'Existing schema found')
    }

    const credDefs = (await tractionRequest.get(`/anoncreds/credential-definitions`, { params: { schema_id } })).data
    let cred_def_id = ''
    if (credDefs.credential_definition_ids.length <= 0) {
      logger.info({ schema_id }, 'Credential definition not found, creating new credential definition')
      const resp = (
        await tractionRequest.post(`/anoncreds/credential-definition`, {
          credential_definition: {
            schemaId: schema_id,
            issuerId: process.env.TRACTION_DID,
            tag: credential.name,
          },
          options: {
            revocation_registry_size: 3000,
            support_revocation: true,
          },
        })
      ).data
      cred_def_id = resp.credential_definition_state.credential_definition_id
      logger.info({ cred_def_id }, 'Credential definition created')
    } else {
      cred_def_id = credDefs.credential_definition_ids[0]
      logger.debug({ cred_def_id }, 'Existing credential definition found')
    }
    return cred_def_id
  }

  @Post('/offerCredential')
  public async offerCredential(@Body() params: any) {
    logger.debug({ incomingParams: params }, 'Incoming credential offer params')
    const resolvedAttributes =
      params.credential_preview?.attributes != null
        ? resolveCredentialAttributes(params.credential_preview.attributes).map((attr: any) => ({
            ...attr,
            value: String(attr.value), // Ensure all values are strings for credential preview
          }))
        : []

    logger.info(
      { connectionId: params.connection_id, credentialName: params.credential_preview?.attributes?.[0]?.name },
      'Offering credential',
    )

    // Construct the new payload format
    const payload = {
      auto_issue: params.auto_issue ?? true,
      auto_remove: params.auto_remove ?? false,
      connection_id: params.connection_id,
      credential_preview: {
        '@type': 'issue-credential/2.0/credential-preview',
        attributes: resolvedAttributes,
      },
      filter: params.filter,
      trace: params.trace ?? false,
    }

    try {
      const response = await tractionRequest.post(`/issue-credential-2.0/send-offer`, payload)
      logger.info({ credentialExchangeId: response.data?.cred_ex_id }, 'Credential offer sent')
      return response.data
    } catch (error: any) {
      logger.error(
        {
          status: error.response?.status,
          data: error.response?.data,
          payload,
        },
        'Failed to send credential offer',
      )
      throw error
    }
  }
}
