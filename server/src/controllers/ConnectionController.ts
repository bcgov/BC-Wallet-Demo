import { Body, Get, JsonController, Param, Post } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'
import { tractionRequest } from '../utils/tractionHelper'

@JsonController('/connections')
@Service()
export class ConnectionController {
  @Get('/getConnectionStatus/:connId')
  public async getConnectionStatus(@Param('connId') connectionId: string) {
    logger.debug({ connectionId }, 'Fetching connection status')
    const response = await tractionRequest.get(`/connections/${connectionId}`)
    logger.debug({ connectionId, state: response.data?.state }, 'Connection status retrieved')
    return response.data
  }

  @Get('/invitationId/:id')
  public async getConnectionByInvitation(@Param('id') invitationId: string) {
    logger.debug({ invitationId }, 'Fetching connection by invitation id')
    const response = await tractionRequest.get(`/connections?invitation_msg_id=${invitationId}`)
    return response.data.results[0]
  }

  @Post('/createInvite')
  public async createConnectionInvite(@Body() params: any) {
    logger.info('Creating connection invitation')
    const data = {
      ...params,
      accept: ['didcomm/aip1', 'didcomm/aip2;env=rfc19'],
      alias: 'connection',
      goal: '',
      handshake_protocols: ['https://didcomm.org/didexchange/1.0', 'https://didcomm.org/connections/1.0'],
      protocol_version: '1.1',
      use_public_did: false,
    }
    const response = await tractionRequest.post(`/out-of-band/create-invitation?multi_use=false`, data)
    logger.info({ invitationUrl: response.data?.invitation_url }, 'Connection invitation created')
    return response.data
  }
}

//https://traction-tenant-proxy-dev.apps.silver.devops.gov.bc.ca/out-of-band/create-invitation?multi_use=false
// {"accept":["didcomm/aip1","didcomm/aip2;env=rfc19"],"alias":"hello","goal":"","goal_code":"","handshake_protocols":["https://didcomm.org/didexchange/1.0","https://didcomm.org/connections/1.0"],"my_label":"","protocol_version":"1.1","use_public_did":false}
