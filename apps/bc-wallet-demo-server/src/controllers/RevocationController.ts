import { Body, JsonController, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/revoke')
@Service()
export class RevocationController {
  @Post('/')
  public async acceptProof(@Body() params: any) {
    const revocationResult = (await tractionRequest.post('/revocation/revoke', params)).data
    return revocationResult
  }
}
