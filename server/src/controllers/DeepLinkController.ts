import { Body, JsonController, Post } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/deeplink')
@Service()
export class DeeplinkController {
  @Post('/offerCredential')
  public async offerCredential(@Body() params: any) {
    logger.info({ connectionId: params.connection_id }, 'Deep link: waiting for connection before offering credential')
    const state = await this.waitUntilConnected(params.connection_id)
    if (this.isConnected(state)) {
      logger.info({ connectionId: params.connection_id }, 'Deep link: connection established, issuing credential')
      const resp = await tractionRequest.post(`/issue-credential/send`, params)
      return resp.data
    }
    logger.warn(
      { connectionId: params.connection_id, state },
      'Deep link: connection did not reach active state, credential not offered',
    )
  }

  @Post('/requestProof')
  public async requestProof(@Body() params: any) {
    logger.info({ connectionId: params.connection_id }, 'Deep link: waiting for connection before requesting proof')
    const state = await this.waitUntilConnected(params.connection_id)
    if (this.isConnected(state)) {
      logger.info({ connectionId: params.connection_id }, 'Deep link: connection established, sending proof request')
      const resp = await tractionRequest.post('/present-proof-2.0/send-request', params)
      return resp.data
    }
    logger.warn(
      { connectionId: params.connection_id, state },
      'Deep link: connection did not reach active state, proof not requested',
    )
  }

  private isConnected(state: string) {
    return state === 'complete' || state === 'response' || state === 'active'
  }

  private async waitUntilConnected(connectionId: string): Promise<string> {
    let state = ''
    for (let i = 0; i < 10 && !this.isConnected(state); i++) {
      await new Promise((r) => setTimeout(r, 1000))
      if (!this.isConnected(state)) {
        try {
          const resp = await tractionRequest.get(`/connections/${connectionId}`)
          state = resp.data?.state
          logger.debug({ connectionId, state, attempt: i + 1 }, 'Deep link: polling connection state')
        } catch (error) {
          logger.warn({ connectionId, attempt: i + 1, error }, 'Deep link: failed to poll connection state')
        }
      }
    }
    return state
  }
}
