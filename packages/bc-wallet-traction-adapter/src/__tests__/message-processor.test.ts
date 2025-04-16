import type { StartedRabbitMQContainer } from '@testcontainers/rabbitmq'
import { RabbitMQContainer } from '@testcontainers/rabbitmq'
import type { CredentialAttributeType, CredentialDefinition } from 'bc-wallet-openapi'
import { CredentialType, IssuerType } from 'bc-wallet-openapi'
import type { Sender, SenderOptions } from 'rhea-promise'
import { Connection } from 'rhea-promise'
import { v4 as uuidv4 } from 'uuid'

import { environment } from '../environment'
import { MessageProcessor } from '../message-processor'
import { getTractionService } from '../services/service-manager'
import { ShowcaseApiService } from '../services/showcase-api-service'
import type { Action } from '../types'
import { Topic } from '../types'
import { encryptBuffer } from '../util/CypherUtil'

// Mock ShowcaseApiService
jest.mock('../services/showcase-api-service')

// Mock TractionService
jest.mock('../services/traction-service')

// Create a spy on getTractionService to monitor calls
jest.spyOn(require('../services/service-manager'), 'getTractionService')

describe('MessageProcessor Integration Test', () => {
  jest.setTimeout(60000) // Extend timeout for container startup

  let container: StartedRabbitMQContainer
  let connection: Connection
  let sender: Sender
  let processor: MessageProcessor
  let mockShowcaseApiService: jest.Mocked<ShowcaseApiService>
  const testTopic: Topic = Topic.SHOWCASE_CMD_TESTING

  beforeAll(async () => {
    // Start the RabbitMQ container
    container = await new RabbitMQContainer('rabbitmq:4').start()

    // Setup environment variables for the processor
    process.env.AMQ_HOST = environment.messageBroker.AMQ_HOST = container.getHost()
    environment.messageBroker.AMQ_PORT = container.getMappedPort(5672)
    process.env.AMQ_PORT = environment.messageBroker.AMQ_PORT.toString()
    process.env.AMQ_USER = environment.messageBroker.AMQ_USER = 'guest'
    process.env.AMQ_PASSWORD = environment.messageBroker.AMQ_PASSWORD = 'guest'
    process.env.AMQ_TRANSPORT = environment.messageBroker.AMQ_TRANSPORT = 'tcp'
    process.env.DEFAULT_API_BASE_PATH = environment.traction.DEFAULT_API_BASE_PATH = 'http://localhost:5003'
    process.env.ENCRYPTION_KEY = environment.encryption.ENCRYPTION_KEY = 'F5XH4zeMFB6nLKY7g15kpkVEcxFkGokGbAKSPbzaTEwe'

    // Setup mock ShowcaseApiService
    mockShowcaseApiService = new ShowcaseApiService('') as jest.Mocked<ShowcaseApiService>
    mockShowcaseApiService.updateBearerToken = jest.fn().mockResolvedValue(undefined)
    mockShowcaseApiService.updateCredentialSchemaIdentifier = jest.fn().mockResolvedValue(undefined)
    mockShowcaseApiService.updateCredentialDefIdentifier = jest.fn().mockResolvedValue(undefined)

    // Establish an AMQP connection for sending test messages
    connection = new Connection({
      hostname: container.getHost(),
      port: container.getMappedPort(5672),
      transport: 'tcp',
      reconnect: true,
      username: 'guest',
      password: 'guest',
    })
    await connection.open()

    // Create a sender
    const senderOptions: SenderOptions = {
      target: { address: testTopic },
    }
    sender = await connection.createSender(senderOptions)

    // Start the message processor
    processor = new MessageProcessor(testTopic)
    await processor.start()
  })

  afterAll(async () => {
    // Close AMQP entities and stop the container
    await sender.close()
    await processor.stop()
    await connection.close()
    await container.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should process publish-issuer-assets message successfully', async () => {
    // Create a sample issuer with credential definitions and schemas
    const issuer = {
      id: 'test-issuer-id',
      name: 'Test Issuer',
      description: 'Test Issuer Description',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialDefinitions: [
        {
          id: 'test-cred-def-id',
          name: 'Test Credential',
          version: '1.0',
          type: CredentialType.Anoncred,
          credentialSchema: {
            id: 'schema-id',
            name: 'Test Schema',
            version: '1.0',
            attributes: [
              {
                id: 'attr1',
                name: 'firstName',
                type: 'STRING' as CredentialAttributeType,
                value: 'John',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              {
                id: 'attr2',
                name: 'lastName',
                type: 'STRING' as CredentialAttributeType,
                value: 'Doe',
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          representations: [],
          icon: {
            id: 'icon1',
            mediaType: 'image/png',
            content: 'base64content',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      credentialSchemas: [
        {
          id: 'schema-id',
          name: 'Test Schema',
          version: '1.0',
          attributes: [
            {
              id: 'attr1',
              name: 'firstName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: 'attr2',
              name: 'lastName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Spy on console.debug to detect when the message is processed
    const consoleSpy = jest.spyOn(console, 'debug')

    // Send a message with the issuer
    const messageId = uuidv4()
    const { encrypted, nonce } = encryptBuffer(Buffer.from('test-token', 'utf8'))
    void sender.send({
      message_id: messageId,
      body: JSON.stringify(issuer),
      application_properties: {
        action: 'publish-issuer-assets' as Action,
        tenantId: 'test-tenant',
        tractionApiUrlBase: 'http://localhost:8032',
        showcaseApiUrlBase: 'http://localhost:5003',
        walletId: 'test-wallet',
        accessTokenEnc: encrypted,
        accessTokenNonce: nonce,
      },
    })

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0] === 'Received issuer' && call[1]?.id === 'test-issuer-id')) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })

    // Verify that the getTractionService was called with the correct parameters
    expect(await getTractionService).toHaveBeenCalledWith(
      'test-tenant',
      'http://localhost:5003',
      'http://localhost:8032',
      'test-wallet',
      encrypted,
      nonce,
    )

    consoleSpy.mockRestore()
  })

  test('should reject message with missing action', async () => {
    // Create a sample issuer
    const issuer = {
      id: 'test-issuer-id',
      name: 'Test Issuer',
      description: 'Test Issuer Description',
      type: IssuerType.Aries,
      credentialDefinitions: [],
      credentialSchemas: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Spy on console.error to detect when the message is rejected
    const consoleSpy = jest.spyOn(console, 'error')

    // Send a message without an action
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(issuer),
      application_properties: {
        tenantId: 'test-tenant',
        apiUrlBase: 'http://localhost:5003',
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    void (await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (
          consoleSpy.mock.calls.some((call: (string | string[])[]) => call[0].includes('did not contain an action'))
        ) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    }))

    // Verify the error was logged
    expect(
      consoleSpy.mock.calls.some((call: (string | string[])[]) => call[0].includes('did not contain an action')),
    ).toBeTruthy()

    consoleSpy.mockRestore()
  })

  test('should reject message with missing tenant ID', async () => {
    // Create a sample credential definition
    const credDef: CredentialDefinition = {
      id: 'test-id',
      name: 'Test Credential',
      version: '1.0',
      type: CredentialType.Anoncred,
      credentialSchema: {
        id: 'schema-id',
        name: 'Test Schema',
        version: '1.0',
        attributes: [
          {
            id: 'attr1',
            name: 'firstName',
            type: 'STRING' as CredentialAttributeType,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      representations: [],
      icon: {
        id: 'icon1',
        mediaType: 'image/png',
        content: 'base64content',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Spy on console.error to detect when the message is rejected
    const consoleSpy = jest.spyOn(console, 'error')

    // Send a message without a tenant ID
    const messageId = uuidv4()
    const tenantId = environment.traction.FIXED_TENANT_ID
    environment.traction.FIXED_TENANT_ID = undefined
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        action: 'publish-issuer-assets' as Action,
        apiUrlBase: 'http://localhost:5003',
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (
          consoleSpy.mock.calls.some((call: (string | string[])[]) => call[0].includes('did not contain the tenant id'))
        ) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })

    environment.traction.FIXED_TENANT_ID = tenantId

    consoleSpy.mockRestore()
  })

  test('should reject message with invalid payload', async () => {
    // Spy on console.error to detect when the message is rejected
    const consoleSpy = jest.spyOn(console, 'error')

    // Send a message with invalid JSON
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: '{invalid payload}',
      application_properties: {
        action: 'publish-issuer-assets' as Action,
        tenantId: 'test-tenant',
        apiUrlBase: 'http://localhost:5003',
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (
          consoleSpy.mock.calls.some((call: (string | string[])[]) =>
            call[0].includes('The message body did not contain a valid Issuer payload'),
          )
        ) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })

    consoleSpy.mockRestore()
  })

  test('should reject message with unsupported action', async () => {
    // Create a sample issuer
    const issuer = {
      id: 'test-issuer-id',
      name: 'Test Issuer',
      description: 'Test Issuer Description',
      type: IssuerType.Aries,
      credentialDefinitions: [],
      credentialSchemas: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Spy on console.error to detect when the message is rejected
    const consoleSpy = jest.spyOn(console, 'error')

    // Send a message with an unsupported action
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(issuer),
      application_properties: {
        action: 'unsupported-action' as Action,
        tenantId: 'test-tenant',
        walletId: 'test-wallet',
        apiUrlBase: 'http://localhost:5003',
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call: (string | string[])[]) => call[0].includes('unsupported action'))) {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval)
        resolve()
      }, 5000)
    })

    // Verify the error was logged
    expect(
      consoleSpy.mock.calls.some((call: (string | string[])[]) => call[0].includes('unsupported action')),
    ).toBeTruthy()

    consoleSpy.mockRestore()
  })
})
