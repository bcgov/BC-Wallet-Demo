import { Connection, Receiver, ReceiverEvents, ReceiverOptions } from 'rhea-promise'
import { environment } from './environment'
import { Issuer, IssuerFromJSONTyped } from 'bc-wallet-openapi'
import { TractionService } from './services/traction-service'
import { getTractionService } from './services/service-manager'
import { Action, Topic } from './types'
import { Buffer } from 'buffer'

interface MessageHeaders {
  action?: Action
  tenantId?: string
  apiUrlBase?: string
  walletId?: string
  accessTokenEnc?: Buffer
  accessTokenNonce?: Buffer
}

export class MessageProcessor {
  private readonly connection: Connection
  private receiver!: Receiver

  constructor(private topic: Topic) {
    // Validate that topic is a valid enum value
    if (!Object.values(Topic).includes(topic)) {
      throw new Error(`Invalid topic: ${topic}. Valid topics are: ${Object.values(Topic).join(', ')}`)
    }

    // Setup AMQ broker connection
    this.connection = new Connection({
      hostname: environment.messageBroker.AMQ_HOST,
      port: environment.messageBroker.AMQ_PORT,
      transport: 'tcp',
      reconnect: true,
      username: environment.messageBroker.AMQ_USER,
      password: environment.messageBroker.AMQ_PASSWORD,
    })
  }

  public async start(): Promise<void> {
    await this.connection.open()

    const receiverOptions: ReceiverOptions = {
      source: {
        address: this.topic,
        durable: 2,
        filter: {
          'topic-filter': this.topic,
        },
      },
    }

    this.receiver = await this.connection.createReceiver(receiverOptions)
    this.setupMessageHandler()
    this.setupErrorHandler()
  }

  private setupMessageHandler(): void {
    this.receiver.on(ReceiverEvents.message, async (context) => {
      const message = context.message
      if (!message) {
        return
      }

      const headers = this.getMessageHeaders(message.application_properties)
      const messageId = message.message_id

      // Validate required headers
      if (!headers.action) {
        this.rejectDelivery(context, `message ${messageId} did not contain an action`)
        return
      }

      if (!headers.tenantId) {
        this.rejectDelivery(context, `message ${messageId} did not contain the tenant id`)
        return
      }

      const service = getTractionService(headers.tenantId, headers.apiUrlBase, headers.walletId, headers.accessTokenEnc, headers.accessTokenNonce)

      try {
        const jsonData = JSON.parse(message.body as string)
        await this.processMessage(headers.action, jsonData, service, context, headers)
      } catch (error) {
        this.rejectDelivery(context, `Failed to parse message body for ${messageId}: ${error}`, headers)
      }
    })
  }

  private setupErrorHandler(): void {
    this.receiver.on(ReceiverEvents.receiverError, (context) => {
      console.error(`[${this.topic}] Receiver error:`, context.receiver?.error)
    })
  }

  private getMessageHeaders(applicationProperties: any): MessageHeaders {
    if (!applicationProperties) {
      return {}
    }

    return {
      action: applicationProperties['action'] as Action | undefined,
      tenantId: applicationProperties['tenantId'] as string | undefined,
      apiUrlBase: applicationProperties['apiUrlBase'] as string | undefined,
      walletId: applicationProperties['walletId'] as string | undefined,
      accessTokenEnc: applicationProperties['accessTokenEnc'] as Buffer | undefined,
      accessTokenNonce: applicationProperties['accessTokenNonce'] as Buffer | undefined,
    }
  }

  private async processMessage(action: Action, jsonData: any, service: TractionService, context: any, headers: MessageHeaders): Promise<void> {
    switch (action) {
      case 'publish-issuer': {
        await this.handlePublishIssuerAssets(jsonData, service, context, headers)
        break
      }
      default: {
        const errorMsg = `An error occurred while processing message ${context.message.message_id}; unsupported action ${action}`
        this.rejectDelivery(context, errorMsg, headers)
      }
    }
  }

  private async handlePublishIssuerAssets(jsonData: any, service: TractionService, context: any, headers: MessageHeaders): Promise<void> {
    const issuer: Issuer = IssuerFromJSONTyped(jsonData, false)
    try {
      console.debug('Received issuer', issuer)
      await service.publishIssuerAssets(issuer)
      if (context.delivery) {
        context.delivery.accept()
      }
    } catch (e) {
      const errorMsg = `An error occurred while publishing issuer ${issuer.id} / ${issuer.name} of type ${issuer.type} to Traction`
      console.error(errorMsg)
      if (context.delivery) {
        context.delivery.reject({
          info: `apiBasePath: ${headers.apiUrlBase ?? environment.traction.DEFAULT_API_BASE_PATH}, tenantId: ${headers.tenantId}, walletId: ${headers.walletId}`,
          condition: 'fatal error',
          description: errorMsg,
          value: [issuer],
        }) // FIXME context.delivery.release() to redeliver ??
      }
    }
  }

  private rejectDelivery(context: any, errorMsg: string, headers?: MessageHeaders): void {
    console.error(errorMsg)
    if (context.delivery) {
      const rejectOptions: any = { description: errorMsg }

      if (headers) {
        rejectOptions.info = `apiBasePath: ${headers.apiUrlBase ?? environment.traction.DEFAULT_API_BASE_PATH}, tenantId: ${headers.tenantId}, walletId: ${headers.walletId}`
        rejectOptions.condition = 'fatal error'
      }

      context.delivery.reject(rejectOptions)
    }
  }

  public async stop(): Promise<void> {
    if (this.receiver) {
      await this.receiver.close()
    }
    if (this.connection) {
      await this.connection.close()
    }
  }
}
