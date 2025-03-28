import { RabbitMQContainer, StartedRabbitMQContainer } from '@testcontainers/rabbitmq'
import { Connection, Sender, SenderOptions } from 'rhea-promise'
import { CredentialAttributeType, CredentialDefinition, CredentialType } from 'bc-wallet-openapi'
import { v4 as uuidv4 } from 'uuid'
import { MessageProcessor } from '../message-processor'
import { Action, Topic } from '../types'
import { getTractionService } from '../services/service-manager'
import { environment } from '../environment'
import { encryptBuffer } from '../util/CypherUtil'

// Create a spy on getTractionService to monitor calls
jest.spyOn(require('../services/service-manager'), 'getTractionService')

describe('MessageProcessor Integration Test', () => {
  jest.setTimeout(60000) // Extend timeout for container startup

  let container: StartedRabbitMQContainer
  let connection: Connection
  let sender: Sender
  let processor: MessageProcessor
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
    process.env.DEFAULT_API_BASE_PATH = environment.traction.DEFAULT_API_BASE_PATH = 'http://localhost:8080'

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

  test('should process store-credentialdef message successfully', async () => {
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
    }

    // Spy on console.debug to detect when the message is processed
    const consoleSpy = jest.spyOn(console, 'debug')

    // Send a message with the credential definition
    const messageId = uuidv4()
    const { encrypted, nonce } = encryptBuffer(Buffer.from('test-token', 'utf8'))
    void sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        action: 'store-credentialdef' as Action,
        tenantId: 'test-tenant',
        apiUrlBase: 'http://localhost:8080',
        walletId: 'test-wallet',
        accessTokenEnc: encrypted,
        accessTokenNonceEnc: nonce,
      },
    })

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0] === 'Received credential definition' && call[1]?.id === 'test-id')) {
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
    expect(getTractionService).toHaveBeenCalledWith('test-tenant', 'http://localhost:8080', 'test-wallet', 'test-token')

    consoleSpy.mockRestore()
  })

  test('should reject message with missing action', async () => {
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

    // Send a message without an action
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        tenantId: 'test-tenant',
      },
    }))

    // Wait for the message to be processed
    void (await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0].includes('did not contain an action'))) {
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
    expect(consoleSpy.mock.calls.some((call) => call[0].includes('did not contain an action'))).toBeTruthy()

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
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        action: 'store-credentialdef' as Action,
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0].includes('did not contain the tenant id'))) {
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
    expect(consoleSpy.mock.calls.some((call) => call[0].includes('did not contain the tenant id'))).toBeTruthy()

    consoleSpy.mockRestore()
  })

  test('should reject message with invalid JSON', async () => {
    // Spy on console.error to detect when the message is rejected
    const consoleSpy = jest.spyOn(console, 'error')

    // Send a message with invalid JSON
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: '{invalid json}',
      application_properties: {
        action: 'store-credentialdef' as Action,
        tenantId: 'test-tenant',
        apiUrlBase: 'http://localhost:8080',
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0].includes('Failed to parse message body'))) {
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
    expect(consoleSpy.mock.calls.some((call) => call[0].includes('Failed to parse message body'))).toBeTruthy()

    consoleSpy.mockRestore()
  })

  test('should reject message with unsupported action', async () => {
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

    // Send a message with an unsupported action
    const messageId = uuidv4()
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        action: 'unsupported-action' as Action,
        tenantId: 'test-tenant',
      },
    }))

    // Wait for the message to be processed
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (consoleSpy.mock.calls.some((call) => call[0].includes('unsupported action'))) {
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
    expect(consoleSpy.mock.calls.some((call) => call[0].includes('unsupported action'))).toBeTruthy()

    consoleSpy.mockRestore()
  })
})
