import type { Socket } from 'socket.io'

import { Body, JsonController, Post, Req, UnauthorizedError } from 'routing-controllers'
import { Inject, Service } from 'typedi'

import { RevocationService } from '../services/RevocationService'
import logger from '../utils/logger'

@JsonController('/whook/topic')
@Service()
export class WebhookController {
  public constructor(@Inject() private revocationService: RevocationService) {}

  @Post('/*')
  public async handlePostWhook(@Body() params: any, @Req() req: any) {
    logger.debug({ path: req.path }, 'Webhook payload received')
    const socketMap: Map<string, Socket> | undefined = req.app.get('sockets')
    const api_key = req.headers['x-api-key']
    if (api_key !== process.env.WEBHOOK_SECRET) {
      logger.warn({ path: req.path }, 'Webhook received with invalid API key')
      throw new UnauthorizedError('Invalid API key')
    }
    const connectionId = params.connection_id
    const path = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path
    const endpointSplit = path.split('/')
    const endpoint = endpointSplit[endpointSplit.length - 1]
    params.endpoint = endpoint

    // Only forward webhooks that have a connection_id
    if (!connectionId) {
      logger.debug({ endpoint }, 'Webhook received without connection_id, skipping socket forwarding')
      return { message: 'Webhook received' }
    }

    logger.info({ endpoint, connectionId, state: params.state }, 'Webhook received')
    if (endpoint === 'issuer_cred_rev') {
      logger.debug(
        { rev_reg_id: params.rev_reg_id, cred_rev_id: params.cred_rev_id, state: params.state },
        'issuer_cred_rev payload',
      )
    }

    // Persist issued credential and enrich payload with internal ID.
    // DB write is best-effort: failure logs but does not break webhook flow.
    // Must happen before socket.emit so issuedCredentialId is in the payload.
    let payload = params
    if (endpoint === 'issue_credential_v2_0' && params.state === 'credential-issued') {
      try {
        const doc = await this.revocationService.handleCredentialIssued(params)
        if (doc) payload = { ...params, issuedCredentialId: doc._id }
      } catch (err) {
        logger.error(err, 'Failed to persist issued credential from webhook')
      }
    }

    const socket = socketMap?.get(connectionId)
    if (socket) {
      socket.emit('message', payload)
      logger.debug({ endpoint, connectionId }, 'Webhook forwarded to socket')
    } else {
      logger.warn({ endpoint, connectionId }, 'No active socket found for connection, webhook not forwarded')
    }
    return { message: 'Webhook received' }
  }
}
