import { isAxiosError } from 'axios'
import { Body, Get, JsonController, NotFoundError, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { CreateCredentialInput } from '../content/types'
import { CredentialModel, LeanCredentialDoc } from '../db/models/Credential'
import { toCredentialResponse } from '../utils/credentialMapper'
import logger from '../utils/logger'
import { resolveCredentialAttributes } from '../utils/resolveMarkers'
import { tractionRequest } from '../utils/tractionHelper'

const LEDGER_PROPAGATION_MS = 5000 // wait after schema creation before creating cred def

interface CredentialOfferParams {
  connection_id: string
  auto_issue?: boolean
  auto_remove?: boolean
  trace?: boolean
  filter?: Record<string, unknown>
  credential_preview?: {
    attributes: { name: string; value: string | number }[]
  }
}

@JsonController('/credentials')
@Service()
export class CredentialController {
  /**
   * Retrieve all credentials from database
   */
  @Get('/')
  public async getAllCredentials() {
    logger.debug('Fetching all credentials')
    const credentials = await CredentialModel.find().lean<LeanCredentialDoc[]>()
    logger.debug({ count: credentials.length }, 'Credentials fetched')
    return credentials.map(toCredentialResponse)
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
    const credential = await CredentialModel.findById(credentialId).lean<LeanCredentialDoc>()

    if (!credential) {
      logger.warn({ credentialId }, 'Credential not found')
      throw new NotFoundError(`Credential with id "${credentialId}" not found.`)
    }

    logger.debug({ credentialId }, 'Credential found')
    return toCredentialResponse(credential)
  }

  @Post('/getOrCreateCredDef')
  public async getOrCreateCredDef(@Body() credential: CreateCredentialInput) {
    logger.info({ name: credential.name, version: credential.version }, 'Resolving credential definition')
    const schemas = (
      await tractionRequest.get(`/schemas/created`, {
        params: { schema_name: credential.name, schema_version: credential.version },
      })
    ).data
    let schema_id = ''
    if (schemas.schema_ids.length <= 0) {
      logger.info({ name: credential.name, version: credential.version }, 'Schema not found, creating new schema')
      const schemaAttrs = credential.attributes.map((attr) => attr.name)
      const resp = (
        await tractionRequest.post(`/schemas`, {
          attributes: schemaAttrs,
          schema_name: credential.name,
          schema_version: credential.version,
        })
      ).data
      schema_id = resp.sent.schema_id
      logger.info({ schema_id }, 'Schema created, waiting for ledger propagation')
      await new Promise((r) => setTimeout(r, LEDGER_PROPAGATION_MS))
    } else {
      schema_id = schemas.schema_ids[0]
      logger.debug({ schema_id }, 'Existing schema found')
    }

    const credDefs = (await tractionRequest.get(`/credential-definitions/created`, { params: { schema_id } })).data
    let cred_def_id = ''
    if (credDefs.credential_definition_ids.length <= 0) {
      logger.info({ schema_id }, 'Credential definition not found, creating new credential definition')
      const resp = (
        await tractionRequest.post(`/credential-definitions`, {
          revocation_registry_size: 25,
          schema_id,
          support_revocation: true,
          tag: credential.name,
        })
      ).data
      cred_def_id = resp.sent.credential_definition_id
      logger.info({ cred_def_id }, 'Credential definition created')
    } else {
      cred_def_id = credDefs.credential_definition_ids[0]
      logger.debug({ cred_def_id }, 'Existing credential definition found')
    }
    return cred_def_id
  }

  @Post('/offerCredential')
  public async offerCredential(@Body() params: CredentialOfferParams) {
    logger.debug({ incomingParams: params }, 'Incoming credential offer params')
    const resolvedAttributes =
      params.credential_preview?.attributes != null
        ? resolveCredentialAttributes(params.credential_preview.attributes).map((attr) => ({
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
    } catch (error) {
      if (isAxiosError(error)) {
        logger.error(
          {
            status: error.response?.status,
            data: error.response?.data,
            payload,
          },
          'Failed to send credential offer',
        )
      }
      throw error
    }
  }
}
