import type { Socket } from 'socket.io'

import { BadRequestError, Body, Get, JsonController, NotFoundError, Post, QueryParam, Req } from 'routing-controllers'
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
    let result
    try {
      result = await this.revocationService.revokeCredential(body.cred_ex_id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.startsWith('IssuedCredential not found')) throw new NotFoundError(msg)
      if (msg === 'credential already revoked') throw new BadRequestError(msg)
      throw err
    }
    logger.info({ cred_ex_id: body.cred_ex_id }, 'Credential revoked')

    const socketMap: Map<string, Socket> | undefined = req.app.get('sockets')
    const socket = socketMap?.get(result.connection_id)
    if (socket) socket.emit('revocation', { cred_ex_id: body.cred_ex_id, status: 'revoked' })

    return result
  }

  // No Keycloak auth: this endpoint is on the /demo tier, consistent with
  // /proofs/:proofId and /connections/* which are also unguarded. The
  // connection_id is an opaque Traction UUIDv4 -- knowing it implies participation
  // in that connection, so it acts as an implicit access token.
  @Get('/')
  public async getRevocations(@QueryParam('connection_id') connectionId: string) {
    return this.revocationService.getByConnection(connectionId)
  }
}
