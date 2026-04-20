import { Body, JsonController, Post } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/revoke')
@Service()
export class RevocationController {
  @Post('/')
  public async acceptProof(@Body() params: any) {
    logger.info(
      { connectionId: params.connection_id, credentialRevocationId: params.cred_rev_id },
      'Revoking credential',
    )
    const revocationResult = (await tractionRequest.post('/revocation/revoke', params)).data
    logger.info({ credentialRevocationId: params.cred_rev_id }, 'Credential revoked')
    return revocationResult
  }
}
