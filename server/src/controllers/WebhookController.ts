import type { Socket } from 'socket.io'

import { Body, JsonController, Post, Req } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'

@JsonController('/whook/topic')
@Service()
export class WebhookController {
  @Post('/*')
  public async handlePostWhook(@Body() params: any, @Req() req: any) {
    const socketMap: Map<string, Socket> = req.app.get('sockets')
    const api_key = req.headers['x-api-key']
    if (api_key !== process.env.WEBHOOK_SECRET) {
      logger.warn({ path: req.path }, 'Webhook received with invalid API key')
      return { message: 'Unauthorized', status: 401 }
    }
    const connectionId = params.connection_id
    const path = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path
    const endpointSplit = path.split('/')
    const endpoint = endpointSplit[endpointSplit.length - 1]
    params.endpoint = endpoint

    logger.info({ endpoint, connectionId }, 'Webhook received')

    const socket = socketMap.get(connectionId)
    if (socket) {
      socket.emit('message', params)
      logger.debug({ endpoint, connectionId }, 'Webhook forwarded to socket')
    } else {
      logger.warn({ endpoint, connectionId }, 'No active socket found for connection, webhook not forwarded')
    }
    return { message: 'Webhook received' }
  }
}
