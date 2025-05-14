import {
  type CredentialDefinitionImportRequest,
  CredentialSchemaImportRequest,
  instanceOfCredentialDefinitionImportRequest,
  instanceOfCredentialSchemaImportRequest,
  instanceOfIssuer,
  Issuer,
} from 'bc-wallet-openapi'
import type { Buffer } from 'buffer'
import type { Receiver, ReceiverOptions } from 'rhea-promise'
import { Connection, ReceiverEvents } from 'rhea-promise'

import { DEBUG_ENABLED, environment } from './environment'
import { getTractionService } from './services/service-manager'
import type { TractionService } from './services/traction-service'
import { Action, Topic, TOPICS } from './types'

interface MessageHeaders {
  action?: Action
  showcaseApiUrlBase?: string
  tractionApiUrlBase?: string
  tractionTenantId?: string
  tractionWalletId?: string
  accessTokenEnc?: Buffer
  accessTokenNonce?: Buffer
}

export class MessageProcessor {
  private readonly connection: Connection
  private receiver!: Receiver

  public constructor(private topic: Topic) {
    // Validate that topic is a valid enum value
    if (!TOPICS.includes(topic)) {
      throw new Error(`Invalid topic: ${topic}. Valid topics are: ${TOPICS.join(', ')}`)
    }

    // Setup AMQ broker connection
    this.connection = new Connection(environment.messageBroker.getConnectionOptions())
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

      if (!headers.tractionTenantId && !environment.traction.TRACTION_DEFAULT_TENANT_ID) {
        this.rejectDelivery(context, `message ${messageId} did not contain the tenant id`)
        return
      }

      if (!headers.tractionWalletId && !environment.traction.TRACTION_DEFAULT_TENANT_ID) {
        this.rejectDelivery(context, `message ${messageId} did not contain the wallet id`)
        return
      }

      const service = await getTractionService(
        headers.tractionTenantId ?? environment.traction.TRACTION_DEFAULT_TENANT_ID!,
        environment.showcase.TRACTION_FIXED_SHOWCASE_API_URL ||
          headers.showcaseApiUrlBase ||
          environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        headers.tractionApiUrlBase || environment.traction.TRACTION_DEFAULT_API_URL,
        headers.tractionWalletId || environment.traction.TRACTION_DEFAULT_TENANT_ID!,
        headers.accessTokenEnc,
        headers.accessTokenNonce,
      )

      try {
        await this.processMessage(headers.action, message.body, service, context, headers)
      } catch (error) {
        this.rejectDelivery(context, `Failed to parse message body for ${messageId}: ${error.message}`, headers)
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
      tractionTenantId: applicationProperties['tenantId'] as string | undefined,
      tractionApiUrlBase: applicationProperties['tractionApiUrlBase'] as string | undefined,
      showcaseApiUrlBase: applicationProperties['showcaseApiUrlBase'] as string | undefined,
      tractionWalletId: applicationProperties['walletId'] as string | undefined,
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
    if (DEBUG_ENABLED) {
      console.debug(`Received message with action ${action}`, headers, payload)
    }

    switch (action) {
      case 'import.cred-schema':
        await this.handleImportCredentialSchema(payload, service, context, headers)
        break
      case 'import.cred-def':
        await this.handleImportCredentialDefinition(payload, service, context, headers)
        break
      case 'publish.issuer-assets': {
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
    if (typeof payload !== 'object' || !instanceOfIssuer(payload)) {
      return Promise.reject(Error('The message body did not contain a valid Issuer payload'))
    }

    const issuer: Issuer = payload as Issuer
    try {
      if (DEBUG_ENABLED) {
        console.debug('Received issuer', issuer)
      }
      await service.publishIssuerAssets(issuer)
      if (context.delivery) {
        context.delivery.accept()
      }
    } catch (e) {
      const errorMsg = this.buildErrorMessage(issuer, e)
      console.error(errorMsg)
      console.debug('Stack:', e.stack)

      if (context.delivery) {
        context.delivery.reject({
          info: `apiBasePath: ${headers.tractionApiUrlBase ?? environment.traction.TRACTION_DEFAULT_API_URL}, tenantId: ${headers.tractionTenantId}, walletId: ${headers.tractionWalletId}`,
          condition: 'fatal error',
          description: errorMsg,
          value: [issuer],
        }) // FIXME context.delivery.release() to redeliver ??
      }
    }
  }

  private buildErrorMessage(issuer: Issuer, e: Error) {
    const parts = []
    parts.push(
      `An error occurred while publishing issuer ${issuer.id} / ${issuer.name} of type ${issuer.type} to Traction. Reason: ${e.message}`,
    )

    if ('cause' in e && e.cause) {
      parts.push(`Cause: ${e.cause}`)
    }

    if ('details' in e && e.details && Array.isArray(e.details) && e.details.length) {
      parts.push(e.details.join('\r\n'))
    }

    return parts.join('\r\n')
  }

  private async handleImportCredentialSchema(
    payload: object,
    service: TractionService,
    context: any,
    headers: MessageHeaders,
  ): Promise<void> {
    if (typeof payload !== 'object' || !instanceOfCredentialSchemaImportRequest(payload)) {
      return Promise.reject(Error('The message body did not contain a valid Issuer payload'))
    }

    const importRequest = payload as CredentialSchemaImportRequest
    try {
      if (DEBUG_ENABLED) {
        console.debug('Received credential schema import request', importRequest)
      }
      await service.importCredentialSchema(importRequest)
      if (context.delivery) {
        context.delivery.accept()
      }
    } catch (e) {
      const errorMsg = `An error occurred while importing credential schema ${importRequest.name} with identifier ${importRequest.identifier} to Traction. Reason: ${e.message}`
      console.error(errorMsg)
      if (context.delivery) {
        context.delivery.reject({
          info: `apiBasePath: ${headers.tractionApiUrlBase ?? environment.traction.TRACTION_DEFAULT_API_URL}, tenantId: ${headers.tractionTenantId}, walletId: ${headers.tractionWalletId}`,
          condition: 'fatal error',
          description: errorMsg,
          value: [importRequest],
        }) // FIXME context.delivery.release() to redeliver ??
      }
    }
  }

  private async handleImportCredentialDefinition(
    payload: object,
    service: TractionService,
    context: any,
    headers: MessageHeaders,
  ): Promise<void> {
    if (typeof payload !== 'object' || !instanceOfCredentialDefinitionImportRequest(payload)) {
      return Promise.reject(Error('The message body did not contain a valid Issuer payload'))
    }

    const credentialDefinition = payload as CredentialDefinitionImportRequest
    try {
      if (DEBUG_ENABLED) {
        console.debug('Received credential definition import request', credentialDefinition)
      }
      await service.importCredentialDefinition(credentialDefinition)
      if (context.delivery) {
        context.delivery.accept()
      }
    } catch (e) {
      const errorMsg = `An error occurred while importing credential definition ${credentialDefinition.name} / ${credentialDefinition.name} with identifier ${credentialDefinition.identifier} to Traction. Reason: ${e.message}`
      console.error(errorMsg)
      if (context.delivery) {
        context.delivery.reject({
          info: `apiBasePath: ${headers.tractionApiUrlBase ?? environment.traction.TRACTION_DEFAULT_API_URL}, tenantId: ${headers.tractionTenantId}, walletId: ${headers.tractionWalletId}`,
          condition: 'fatal error',
          description: errorMsg,
          value: [credentialDefinition],
        }) // FIXME context.delivery.release() to redeliver ??
      }
    }
  }

  private rejectDelivery(context: any, errorMsg: string, headers?: MessageHeaders): void {
    console.error(errorMsg)
    if (context.delivery) {
      const rejectOptions: any = { description: errorMsg }

      if (headers) {
        rejectOptions.info = `apiBasePath: ${headers.tractionApiUrlBase ?? environment.traction.TRACTION_DEFAULT_API_URL}, tenantId: ${headers.tractionTenantId}, walletId: ${headers.tractionWalletId}`
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
