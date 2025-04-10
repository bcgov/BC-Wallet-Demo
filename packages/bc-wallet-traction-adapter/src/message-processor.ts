import type { Issuer } from 'bc-wallet-openapi'
import { IssuerFromJSONTyped } from 'bc-wallet-openapi'
import type { Buffer } from 'buffer'
import type { Receiver, ReceiverOptions } from 'rhea-promise'
import { Connection, ReceiverEvents } from 'rhea-promise'

import { environment } from './environment'
import { getTractionService } from './services/service-manager'
import type { TractionService } from './services/traction-service'
import type { Action } from './types'
import { Topic } from './types'

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

  public constructor(private topic: Topic) {
    // Validate that topic is a valid enum value
    if (!Object.values(Topic).includes(topic)) {
      throw new Error(`Invalid topic: ${topic}. Valid topics are: ${Object.values(Topic).join(', ')}`)
    }

    // Setup AMQ broker connection
    this.connection = new Connection(environment.messageBroker.getConnectionOptions())
  }

  public async start(): Promise<void> {
    await this.connection.open()

    const receiverOptions: ReceiverOptions = {
      source: {
        address: this.topic,
        durable: 1,
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

      if (!headers.tenantId && !environment.traction.FIXED_TENANT_ID) {
        this.rejectDelivery(context, `message ${messageId} did not contain the tenant id`)
        return
      }

      if (!headers.walletId && !environment.traction.FIXED_WALLET_ID) {
        this.rejectDelivery(context, `message ${messageId} did not contain the wallet id`)
        return
      }

      const service = await getTractionService(
        headers.tenantId ?? environment.traction.FIXED_TENANT_ID!,
        headers.apiUrlBase,
        headers.walletId ?? environment.traction.FIXED_WALLET_ID!,
        headers.accessTokenEnc,
        headers.accessTokenNonce,
      )

      try {
        await this.processMessage(headers.action, message.body, service, context, headers)
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

  private async processMessage(
    action: Action,
    payload: object,
    service: TractionService,
    context: any,
    headers: MessageHeaders,
  ): Promise<void> {
    switch (action) {
      case 'publish-issuer-assets': {
        await this.handlePublishIssuerAssets(payload, service, context, headers)
        break
      }
      default: {
        const errorMsg = `An error occurred while processing message ${context.message.message_id}; unsupported action ${action}`
        this.rejectDelivery(context, errorMsg, headers)
      }
    }
  }

  private async handlePublishIssuerAssets(
    payload: object,
    service: TractionService,
    context: any,
    headers: MessageHeaders,
  ): Promise<void> {
    const issuer: Issuer = payload as Issuer
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
