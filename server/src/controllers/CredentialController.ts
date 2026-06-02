import { isAxiosError } from 'axios'
import { Body, Get, JsonController, NotFoundError, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { CredentialModel, LeanCredentialDoc } from '../db/models/Credential'
import logger from '../utils/logger'
import { resolveCredentialAttributes } from '../utils/resolveMarkers'
import { tractionRequest } from '../utils/tractionHelper'

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
    // Map to frontend Credential type with id instead of _id
    return credentials.map((credential: LeanCredentialDoc) => {
      const response: any = {
        id: String(credential._id),
        name: credential.name,
        icon: credential.icon,
        version: credential.version,
        attributes: resolveCredentialAttributes(credential.attributes || []),
      }
      if (credential.schema_id) response.schema_id = credential.schema_id
      if (credential.cred_def_id) response.cred_def_id = credential.cred_def_id
      if (credential.status) response.status = credential.status
      return response
    })
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
    // Map to frontend Credential type with id instead of _id
    const response: any = {
      id: String(credential._id),
      name: credential.name,
      icon: credential.icon,
      version: credential.version,
      attributes: resolveCredentialAttributes(credential.attributes || []),
    }
    if (credential.schema_id) response.schema_id = credential.schema_id
    if (credential.cred_def_id) response.cred_def_id = credential.cred_def_id
    if (credential.status) response.status = credential.status
    return response
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
