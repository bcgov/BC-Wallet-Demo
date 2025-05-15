import { StartedRabbitMQContainer } from '@testcontainers/rabbitmq'
import { CredentialAttributeType, CredentialDefinition, IdentifierType } from 'bc-wallet-openapi'
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
import { setupRabbitMQ } from './globalTestSetup'

// Mock ShowcaseApiService
jest.mock('../services/showcase-api-service')

// Mock TractionService
jest.mock('../services/traction-service')

// Create a spy on getTractionService to monitor calls
jest.spyOn(require('../services/service-manager'), 'getTractionService')

const logContains = (spy: jest.SpyInstance, messagePattern: string): boolean =>
  spy.mock.calls.some((call: (string | string[])[]) => {
    const message = call[0]
    return typeof message === 'string' && message.includes(messagePattern)
  })

async function waitForConsoleMessage(spy: jest.SpyInstance, messagePattern: string, timeoutMs = 5000): Promise<void> {
  return new Promise<void>((resolve) => {
    const checkInterval = setInterval(() => {
      if (logContains(spy, messagePattern)) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 100)

    // Timeout after a specified duration
    setTimeout(() => {
      clearInterval(checkInterval)
      resolve()
    }, timeoutMs)
  })
}

describe('MessageProcessor Integration Test', () => {
  jest.setTimeout(60000) // Extend timeout for container startup

  let container: StartedRabbitMQContainer
  let connection: Connection
  let sender: Sender
  let processor: MessageProcessor
  let mockShowcaseApiService: jest.Mocked<ShowcaseApiService>

  const testTopic: Topic = 'showcase-cmd-testing'

  beforeAll(async () => {
    container = await setupRabbitMQ()

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

  test('should process publish.issuer-assets message successfully', async () => {
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
      body: issuer,
      application_properties: {
        action: 'publish.issuer-assets' as Action,
        tenantId: 'test-tenant',
        tractionApiUrlBase: environment.traction.TRACTION_DEFAULT_API_URL,
        showcaseApiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        walletId: 'test-wallet',
        accessTokenEnc: encrypted,
        accessTokenNonce: nonce,
      },
    })

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'Received issuer')

    // Verify that the getTractionService was called with the correct parameters
    expect(await getTractionService).toHaveBeenCalledWith(
      'test-tenant',
      environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
      environment.traction.TRACTION_DEFAULT_API_URL,
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
        apiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'did not contain an action')

    // Verify the error was logged
    expect(logContains(consoleSpy, 'did not contain an action')).toBeTruthy()

    consoleSpy.mockRestore()
  })

  test('should reject message with missing tenant ID', async () => {
    // Create a sample credential definition
    const credDef: CredentialDefinition = {
      id: 'test-id',
      tenantId: 'test-tenant',
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
    const tenantId = environment.traction.TRACTION_DEFAULT_TENANT_ID
    environment.traction.TRACTION_DEFAULT_TENANT_ID = undefined // temporarily clear the tenant, otherwise it will find the fixed tenant from the env and we cannot test the error message
    void (await sender.send({
      message_id: messageId,
      body: JSON.stringify(credDef),
      application_properties: {
        action: 'publish.issuer-assets' as Action,
        apiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'did not contain the tenant id')

    environment.traction.TRACTION_DEFAULT_TENANT_ID = tenantId

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
        action: 'publish.issuer-assets' as Action,
        tenantId: 'test-tenant',
        apiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        walletId: 'test-wallet',
      },
    }))

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'The message body did not contain a valid Issuer payload')

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
        apiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
      },
    }))

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'unsupported action')

    // Verify the error was logged
    expect(logContains(consoleSpy, 'unsupported action')).toBeTruthy()

    consoleSpy.mockRestore()
  })

  test('should process import.cred-schema message successfully', async () => {
    // Create a sample credential schema
    const credentialSchema = {
      id: 'test-schema-id',
      name: 'Test Schema',
      version: '1.0',
      identifier: 'ABCD:2:TestSchema:1.0',
      identifierType: IdentifierType.Did,
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
    }

    // Spy on console.debug to detect when the message is processed
    const consoleSpy = jest.spyOn(console, 'debug')

    // Send a message with the credential schema
    const messageId = uuidv4()
    const { encrypted, nonce } = encryptBuffer(Buffer.from('test-token', 'utf8'))
    void sender.send({
      message_id: messageId,
      body: credentialSchema,
      application_properties: {
        action: 'import.cred-schema' as Action,
        tenantId: 'test-tenant',
        tractionApiUrlBase: environment.traction.TRACTION_DEFAULT_API_URL,
        showcaseApiUrlBase: environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
        walletId: 'test-wallet',
        accessTokenEnc: encrypted,
        accessTokenNonce: nonce,
      },
    })

    // Wait for the message to be processed
    await waitForConsoleMessage(consoleSpy, 'Received credential schema')

    // Verify that the getTractionService was called with the correct parameters
    expect(await getTractionService).toHaveBeenCalledWith(
      'test-tenant',
      environment.showcase.TRACTION_DEFAULT_SHOWCASE_API_URL,
      environment.traction.TRACTION_DEFAULT_API_URL,
      'test-wallet',
      encrypted,
      nonce,
    )

    consoleSpy.mockRestore()
  })
})
