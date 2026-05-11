import { Body, Delete, Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/proofs')
@Service()
export class ProofController {
  @Get('/:proofId')
  public async getAllCredentialsByConnectionId(@Param('proofId') proofId: string) {
    logger.debug({ proofId }, 'Fetching proof record')
    let proofRecord = ''
    try {
      proofRecord = (await tractionRequest.get(`/present-proof-2.0/records/${proofId}`)).data
    } catch {
      logger.warn({ proofId }, 'Proof record not found')
    }
    return proofRecord
  }

  @Post('/requestProofOOB')
  public async requestProofOOB(@Body() params: any) {
    logger.info('Creating out-of-band proof request')
    const proofRecord = (await tractionRequest.post('/present-proof-2.0/create-request', params)).data

    const template = {
      accept: ['didcomm/aip1', 'didcomm/aip2;env=rfc19'],
      alias: 'BC Wallet Showcase',
      attachments: [
        {
          id: proofRecord.pres_ex_id,
          type: 'present-proof-v2',
        },
      ],
      handshake_protocols: ['https://didcomm.org/didexchange/1.0'],
      metadata: {},
      my_label: 'Proof Invitation',
      protocol_version: '1.1',
      use_public_did: true,
    }
    const invite = (await tractionRequest.post('/out-of-band/create-invitation', template)).data
    logger.info({ presentationExchangeId: proofRecord.pres_ex_id }, 'Out-of-band proof request created')
    return { proofUrl: invite.invitation_url, proof: proofRecord }
  }

  @Post('/requestProof')
  public async requestProof(@Body() params: any) {
    logger.info({ connectionId: params.connection_id }, 'Requesting proof from connection')
    const proofRecord = (await tractionRequest.post('/present-proof-2.0/send-request', params)).data
    logger.info({ presentationExchangeId: proofRecord.pres_ex_id }, 'Proof request sent')
    return proofRecord
  }

  @Delete('/:proofId')
  public async deleteProofById(@Param('proofId') proofId: string) {
    logger.info({ proofId }, 'Deleting proof record')
    const proofRecord = (await tractionRequest.delete(`/present-proof-2.0/records/${proofId}`)).data
    return proofRecord
  }

  @Post('/proofs/:proofId/accept-presentation')
  public async acceptProof(@Body() params: any, @Param('proofId') proofId: string) {
    logger.info({ proofId }, 'Accepting proof presentation')
    const proofAcceptanceRecord = (
      await tractionRequest.post(`/present-proof-2.0/records/${proofId}/verify-presentation`, undefined)
    ).data
    logger.info({ proofId, state: proofAcceptanceRecord?.state }, 'Proof presentation accepted')
    return proofAcceptanceRecord
  }
}
