import type { Issuer } from 'bc-wallet-openapi'
import { instanceOfIssuer, IssuerToJSONTyped } from 'bc-wallet-openapi'
import { Connection, Sender } from 'rhea-promise'
import { Service } from 'typedi'

import { environment } from './environment'
import type { Action } from './types/adapter-backend'
import { encryptBuffer } from './util/CypherUtil'

@Service()
export class AdapterClientApi {
  private readonly isInitComplete: Promise<void>
  private isConnected = false
  private connection: Connection
  private sender!: Sender

  public constructor() {
    this.connection = new Connection(environment.messageBroker.getConnectionOptions())
    this.isInitComplete = this.init() // concurrency protection
  }

  private async init(): Promise<void> {
    if (this.isConnected) {
      if (!this.sender?.isOpen() || !this.sender?.isRemoteOpen() || !this.connection.isOpen()) {
        return Promise.reject(Error('AMQP connection or sender is no longer connected.'))
      }
      return
    }
    await this.connection.open()
    this.sender = await this.connection.createSender({
      target: { address: environment.messageBroker.MESSAGE_PROCESSOR_TOPIC },
    })
    this.isConnected = true
  }

  private async send(action: Action, payload: object, authHeader?: string): Promise<void> {
    try {
      await this.isInitComplete

      const { accessTokenEnc, accessTokenNonce } = this.encryptAuthHeader(authHeader)

      // Send the message
      const delivery = await this.sender.send({
        body: this.payloadToJson(payload),
        application_properties: { action, accessTokenEnc, accessTokenNonce },
      })
      return
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private payloadToJson(payload: object) {
    if (instanceOfIssuer(payload)) {
      return IssuerToJSONTyped(payload, false)
    }
    return JSON.stringify(payload)
  }

  public async publishIssuer(issuer: Issuer, authHeader: string): Promise<void> {
    return this.send('publish-issuer-assets', issuer, authHeader)
  }

  public async close(): Promise<void> {
    if (!this.isConnected) return
    if (this.sender) await this.sender.close()
    await this.connection.close()
    this.isConnected = false
  }

  private encryptAuthHeader(authHeader?: string): { accessTokenEnc: Buffer; accessTokenNonce: Buffer } {
    if (!authHeader) {
      return { accessTokenEnc: Buffer.alloc(0), accessTokenNonce: Buffer.alloc(0) }
    }

    const token = authHeader.replace('Bearer ', '')

    const result = encryptBuffer(Buffer.from(token, 'utf8'))

    return {
      accessTokenEnc: result.encrypted,
      accessTokenNonce: result.nonce,
    }
  }
}
