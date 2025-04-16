import { Body, JsonController, Post, Req } from 'routing-controllers'
import type { Socket } from 'socket.io'
import { Service } from 'typedi'

@JsonController('/whook/topic')
@Service()
export class WebhookController {
  @Post('/*')
  public async handlePostWhook(@Body() params: any, @Req() req: any) {
    const socketMap: Map<string, Socket> = req.app.get('sockets')
    const api_key = req.headers['x-api-key']
    if (api_key !== process.env.WEBHOOK_SECRET) {
      return { message: 'Unauthorized', status: 401 }
    }
    const connectionId = params.connection_id
    const path = req.path.endsWith('/') ? req.path.slice(0, -1) : req.path
    const endpointSplit = path.split('/')
    const endpoint = endpointSplit[endpointSplit.length - 1]
    params.endpoint = endpoint

    const socket = socketMap.get(connectionId)
    if (socket) {
      socket.emit('message', params)
    }
    return { message: 'Webhook received' }
  }
}
