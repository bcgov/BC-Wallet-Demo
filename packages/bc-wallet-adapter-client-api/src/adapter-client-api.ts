import { Service } from 'typedi'
import { Connection, Sender } from 'rhea-promise'
import { environment } from './environment'
import { Issuer } from 'bc-wallet-openapi'
import { encryptBuffer } from './util/CypherUtil'

@Service()
export class AdapterClientApi {
  private readonly isReady: Promise<void>
  private isConnected = false
  private connection: Connection
  private sender!: Sender

  constructor() {
    this.connection = new Connection({
      hostname: environment.messageBroker.AMQ_HOST,
      port: environment.messageBroker.AMQ_PORT,
      transport: 'tcp', // TODO add tls support?
      reconnect: true,
      username: environment.messageBroker.AMQ_USER,
      password: environment.messageBroker.AMQ_PASSWORD,
    })

    this.isReady = this.init() // concurrency protection
  }

  private async init(): Promise<void> {
    if (this.isConnected) {
      if (!this.sender?.isOpen() || !this.sender?.isRemoteOpen() || !this.connection.isOpen()) {
        return Promise.reject(Error('AMQP connection or sender is no longer connected.'))
      }
      return
    }
    await this.connection.open()
    this.sender = await this.connection.createSender({ target: { address: environment.messageBroker.MESSAGE_PROCESSOR_TOPIC } })
    this.isConnected = true
  }

  private async send(action: string, payload: object, authHeader?: string): Promise<void> {
    try {
      await this.isReady

      const { accessTokenEnc, accessTokenNonce } = this.encryptAuthHeader(authHeader)

      const delivery = this.sender.send({
        body: JSON.stringify(payload),
        application_properties: { action, accessTokenEnc, accessTokenNonce },
      })

      if (delivery.remote_state && 'error' in delivery.remote_state) {
        return Promise.reject(Error(`Message rejected: ${delivery.remote_state.error?.description || 'Unknown error'}`))
      }

      if (!delivery.settled) {
        return Promise.reject(Error('Message was not settled by the receiver'))
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  public async publishIssuer(issuer: Issuer, authHeader: string): Promise<void> {
    return this.send('publish-issuer', issuer, authHeader)
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

    if (!token) {
      return { accessTokenEnc: Buffer.alloc(0), accessTokenNonce: Buffer.alloc(0) }
    }

    const result = encryptBuffer(Buffer.from(token, 'utf8'))

    return {
      accessTokenEnc: result.encrypted,
      accessTokenNonce: result.nonce,
    }
  }
}
