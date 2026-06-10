import type { Socket } from 'socket.io'

import { Body, Get, JsonController, Post, QueryParam, Req } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import { RevocationService } from '../services/RevocationService'
import logger from '../utils/logger'

@JsonController('/revocations')
@Service()
export class RevocationController {
  public constructor(@Inject() private revocationService: RevocationService) {}

  @Post('/')
  public async revokeCredential(@Body() body: { cred_ex_id: string }, @Req() req: any) {
    logger.info({ cred_ex_id: body.cred_ex_id }, 'Revoking credential')
    const result = await this.revocationService.revokeCredential(body.cred_ex_id)
    logger.info({ cred_ex_id: body.cred_ex_id }, 'Credential revoked')

    const socketMap: Map<string, Socket> | undefined = req.app.get('sockets')
    const socket = socketMap?.get(result.connection_id)
    if (socket) socket.emit('revocation', { cred_ex_id: body.cred_ex_id, status: 'revoked' })

    return result
  }

  @Get('/')
  public async getRevocations(@QueryParam('connection_id') connectionId: string) {
    return this.revocationService.getByConnection(connectionId)
  }
}
