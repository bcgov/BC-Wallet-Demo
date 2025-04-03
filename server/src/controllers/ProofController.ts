import { Body, Delete, Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import { tractionBaseUrl, tractionRequest } from '../utils/tractionHelper'

@JsonController('/proofs')
@Service()
export class ProofController {
  @Get('/:proofId')
  public async getAllCredentialsByConnectionId(@Param('proofId') proofId: string) {
    let proofRecord = ''
    try {
      proofRecord = (await tractionRequest.get(`/present-proof/records/${proofId}`)).data
    } catch {
      // pass
    }
    return proofRecord
  }

  @Post('/requestProofOOB')
  public async requestProofOOB(@Body() params: any) {
    const proofRecord = (await tractionRequest.post('/present-proof/create-request', params)).data

    const template = {
      accept: ['didcomm/aip1', 'didcomm/aip2;env=rfc19'],
      alias: 'BC Wallet Showcase',
      attachments: [
        {
          id: proofRecord.presentation_exchange_id,
          type: 'present-proof',
        },
      ],
      handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
      metadata: {},
      my_label: 'Proof Invitation',
      protocol_version: '1.1',
      use_public_did: true,
    }
    const invite = (await tractionRequest.post('/out-of-band/create-invitation', template)).data
    return { proofUrl: invite.invitation_url, proof: proofRecord }
  }

  @Post('/requestProof')
  public async requestProof(@Body() params: any) {
    const proofRecord = (await tractionRequest.post('/present-proof/send-request', params)).data
    return proofRecord
  }

  ///present-proof/records/{pres_ex_id}
  @Delete('/:proofId')
  public async deleteProofById(@Param('proofId') proofId: string) {
    const proofRecord = (await tractionRequest.delete(`/present-proof/records/${proofId}`)).data
    return proofRecord
  }

  @Post('/proofs/:proofId/accept-presentation')
  public async acceptProof(@Body() params: any, @Param('proofId') proofId: string) {
    const proofAcceptanceRecord = (
      await tractionRequest.post(`/present-proof/records/${proofId}/verify-presentation`, undefined)
    ).data
    return proofAcceptanceRecord
  }
}
