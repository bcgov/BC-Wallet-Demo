import { Body, Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { Credential } from '../content/types'
import logger from '../utils/logger'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/credentials')
@Service()
export class CredentialController {
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

  @Post('/getOrCreateCredDef')
  public async getOrCreateCredDef(@Body() credential: Credential) {
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
      await new Promise((r) => setTimeout(r, 5000))
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
  public async offerCredential(@Body() params: any) {
    logger.info(
      { connectionId: params.connection_id, credentialName: params.credential_preview?.attributes?.[0]?.name },
      'Offering credential',
    )
    const response = await tractionRequest.post(`/issue-credential/send`, params)
    logger.info({ credentialExchangeId: response.data?.credential_exchange_id }, 'Credential offer sent')
    return response.data
  }
}
