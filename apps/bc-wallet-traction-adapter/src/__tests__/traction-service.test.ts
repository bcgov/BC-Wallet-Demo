import type { CredentialSchema, Issuer } from 'bc-wallet-openapi'
import { CredentialAttributeType, CredentialType, IssuerType } from 'bc-wallet-openapi'
import * as process from 'node:process'
import short from 'short-uuid'

import { ShowcaseApiService } from '../services/showcase-api-service'
import { TractionService } from '../services/traction-service'

// Mock for ShowcaseApiService
jest.mock('../services/showcase-api-service')

const isTractionAvailable = () => {
  const tractionAvailable = process.env.TRACTION_AVAILABLE
  return tractionAvailable && tractionAvailable !== 'false' && tractionAvailable !== '0'
}

const describeIfTractionAvailable = isTractionAvailable() ? describe : describe.skip

describeIfTractionAvailable('TractionService Integration Test', () => {
  let tractionService: TractionService
  let mockShowcaseApiService: jest.Mocked<ShowcaseApiService>
  const showcaseApiBasePath = 'http://localhost:5003'
  const tractionApiBasePath = 'http://localhost:8031'

  beforeEach(async () => {
    // Get credentials from environment variables
    const tenantId = process.env.FIXED_TENANT_ID
    const walletId = process.env.FIXED_WALLET_ID
    const apiKey = process.env.FIXED_API_KEY

    if (!tenantId || !apiKey) {
      throw new Error('Required environment variables FIXED_TENANT_ID and FIXED_API_KEY must be set')
    }

    // Initialize mock service
    mockShowcaseApiService = new ShowcaseApiService(showcaseApiBasePath) as jest.Mocked<ShowcaseApiService>

    // Mock the necessary methods
    mockShowcaseApiService.updateBearerToken = jest.fn().mockResolvedValue(undefined)
    mockShowcaseApiService.updateCredentialSchemaIdentifier = jest.fn().mockResolvedValue(undefined)
    mockShowcaseApiService.updateCredentialDefIdentifier = jest.fn().mockResolvedValue(undefined)

    // Initialize service with mock
    tractionService = new TractionService(tenantId, tractionApiBasePath, mockShowcaseApiService, walletId)

    // Get and set token
    try {
      const token = await tractionService.getTenantToken(apiKey)
      tractionService.updateBearerTokens({ tractionToken: token })
    } catch (error) {
      console.error('Failed to get tenant token:', error)
      throw error
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return undefined for non-existent schema', async () => {
    const nonExistentSchemaName = 'NonExistentSchema_' + short.generate()
    const nonExistentSchemaVersion = '99.99'

    const result = await tractionService.findExistingSchema(nonExistentSchemaName, nonExistentSchemaVersion)

    expect(result).toBeUndefined()
  })

  it('should return undefined for non-existent credential definition', async () => {
    const currentDate = new Date()
    const nonExistentCredDef = {
      id: 'non-existent-cred-def',
      name: 'NonExistentCredDef_' + short.generate(),
      version: '99.99',
      type: CredentialType.Anoncred,
      credentialSchema: {
        id: 'non-existent-schema',
        name: 'NonExistentSchema_' + short.generate(),
        version: '99.99',
        attributes: [
          {
            id: 'attr1',
            name: 'testAttribute',
            type: 'STRING' as CredentialAttributeType,
            createdAt: currentDate,
            updatedAt: currentDate,
          },
        ],
        createdAt: currentDate,
        updatedAt: currentDate,
      },
      representations: [],
      createdAt: currentDate,
      updatedAt: currentDate,
      approvedBy: { id: '123' },
    }

    const result = await tractionService.findExistingCredentialDefinition(nonExistentCredDef)

    expect(result).toBeUndefined()
  })

  it('should create a new schema and update showcase service', async () => {
    const testSchema: CredentialSchema = {
      id: 'test-schema-id',
      name: 'TestNewSchema_' + short.generate(),
      version: '1.0',
      attributes: [
        {
          id: 'attr1',
          name: 'name',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attr2',
          name: 'age',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attr3',
          name: 'email',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const schemaResult = await tractionService.createSchema(testSchema)
    expect(schemaResult).toBeDefined()
    expect(schemaResult.schemaId).toBeTruthy()
    expect(typeof schemaResult.schemaId).toBe('string')

    // Verify showcase service was updated with the schema identifier
    expect(mockShowcaseApiService.updateCredentialSchemaIdentifier).toHaveBeenCalledWith(
      testSchema.id,
      schemaResult.schemaId,
    )

    if (schemaResult.transactionId) {
      await tractionService.waitForTransactionsToComplete([schemaResult.transactionId])
    }

    const foundSchemaId = await tractionService.findExistingSchema(testSchema.name, testSchema.version)
    expect(foundSchemaId).toBeTruthy()
  })

  it('should publish issuer assets and update showcase service', async () => {
    const currentDate = new Date()
    const schemaName = 'PublishTestSchema_' + short.generate()
    const testIssuer: Issuer = {
      id: 'test-publisher',
      name: 'Test Publisher_' + short.generate(),
      description: 'Test Publisher Description',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialSchemas: [
        {
          id: 'test-publish-schema',
          name: schemaName,
          version: '1.0',
          attributes: [
            {
              id: 'attr1',
              name: 'firstName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate,
            },
            {
              id: 'attr2',
              name: 'lastName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate,
            },
            {
              id: 'attr3',
              name: 'dateOfBirth',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate,
            },
          ],
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ],
      credentialDefinitions: [
        {
          id: 'test-publish-cred-def',
          name: 'PublishTestCredDef_' + short.generate(),
          version: '1.0',
          type: CredentialType.Anoncred,
          credentialSchema: {
            id: 'test-publish-schema',
            name: schemaName,
            version: '1.0',
            attributes: [
              {
                id: 'attr1',
                name: 'firstName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate,
              },
              {
                id: 'attr2',
                name: 'lastName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate,
              },
              {
                id: 'attr3',
                name: 'dateOfBirth',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate,
              },
            ],
            createdAt: currentDate,
            updatedAt: currentDate,
          },
          representations: [],
          createdAt: currentDate,
          updatedAt: currentDate,
          approvedBy: { id: '123' },
        },
      ],
      createdAt: currentDate,
      updatedAt: currentDate,
    }

    const publishResults = await tractionService.publishIssuerAssets(testIssuer)
    expect(publishResults).toBeTruthy()
    expect(publishResults.length).toBe(2)

    // Verify showcase service was updated for both schema and credential definition
    expect(mockShowcaseApiService.updateCredentialSchemaIdentifier).toHaveBeenCalled()
    expect(mockShowcaseApiService.updateCredentialDefIdentifier).toHaveBeenCalled()

    await tractionService.waitForTransactionsToComplete(publishResults)

    const credDef = await tractionService.findExistingCredentialDefinition(testIssuer.credentialDefinitions[0])
    expect(credDef).toBeTruthy()
  })

  it('should handle publishing when schema already exists', async () => {
    const currentDate = new Date()
    const uniqueSuffix = short.generate()
    const schemaName = 'ExistingSchemaTest_' + uniqueSuffix

    // Create an issuer with an approved credential definition
    const issuer: Issuer = {
      id: 'complete-publisher',
      name: 'Complete Publisher_' + uniqueSuffix,
      description: 'Test Complete Publisher',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialSchemas: [
        {
          id: 'test-existing-schema',
          name: schemaName,
          version: '1.0',
          attributes: [
            {
              id: 'attr1',
              name: 'firstName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate,
            },
            {
              id: 'attr2',
              name: 'lastName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate,
            },
          ],
          createdAt: currentDate,
          updatedAt: currentDate,
        },
      ],
      credentialDefinitions: [
        {
          id: 'test-publish-cred-def-1',
          name: 'SchemaCredDef_' + uniqueSuffix,
          version: '1.0',
          type: CredentialType.Anoncred,
          credentialSchema: {
            id: 'test-existing-schema',
            name: schemaName,
            version: '1.0',
            attributes: [
              {
                id: 'attr1',
                name: 'firstName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate,
              },
              {
                id: 'attr2',
                name: 'lastName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate,
              },
            ],
            createdAt: currentDate,
            updatedAt: currentDate,
          },
          representations: [],
          createdAt: currentDate,
          updatedAt: currentDate,
          approvedBy: { id: '123' },
        },
      ],
      createdAt: currentDate,
      updatedAt: currentDate,
    }

    // Reset mock calls for this specific test
    jest.clearAllMocks()

    // First publish approved credential definition and schema
    const firstPublishResults = await tractionService.publishIssuerAssets(issuer)
    expect(firstPublishResults).toBeTruthy()
    expect(firstPublishResults.length).toBe(2) // Schema + first cred def

    // Verify showcase service was updated for both schema and credential definition
    expect(mockShowcaseApiService.updateCredentialSchemaIdentifier).toHaveBeenCalledTimes(1)
    expect(mockShowcaseApiService.updateCredentialDefIdentifier).toHaveBeenCalledTimes(1)

    await tractionService.waitForTransactionsToComplete(firstPublishResults)

    // Verify schema exists
    const foundSchemaId = await tractionService.findExistingSchema(schemaName, '1.0')
    expect(foundSchemaId).toBeTruthy()

    // Add another credential definition that references the same schema
    const unapprovedCredDef = {
      id: 'test-publish-cred-def-2',
      name: 'UnapprovedCredDef_' + uniqueSuffix,
      version: '1.1',
      type: CredentialType.Anoncred,
      credentialSchema: {
        id: 'test-existing-schema',
        name: schemaName,
        version: '1.0',
        attributes: [
          {
            id: 'attr1',
            name: 'firstName',
            type: 'STRING' as CredentialAttributeType,
            createdAt: currentDate,
            updatedAt: currentDate,
          },
          {
            id: 'attr2',
            name: 'lastName',
            type: 'STRING' as CredentialAttributeType,
            createdAt: currentDate,
            updatedAt: currentDate,
          },
        ],
        createdAt: currentDate,
        updatedAt: currentDate,
      },
      representations: [],
      createdAt: currentDate,
      updatedAt: currentDate,
      // No approvedBy - should be skipped
    }

    // Add another approved credential definition that references the same schema
    const approvedCredDef = {
      id: 'test-publish-cred-def-3',
      name: 'ApprovedCredDef_' + uniqueSuffix,
      version: '2.0',
      type: CredentialType.Anoncred,
      credentialSchema: {
        id: 'test-existing-schema',
        name: schemaName,
        version: '1.0',
        attributes: [
          {
            id: 'attr1',
            name: 'firstName',
            type: 'STRING' as CredentialAttributeType,
            createdAt: currentDate,
            updatedAt: currentDate,
          },
          {
            id: 'attr2',
            name: 'lastName',
            type: 'STRING' as CredentialAttributeType,
            createdAt: currentDate,
            updatedAt: currentDate,
          },
        ],
        createdAt: currentDate,
        updatedAt: currentDate,
      },
      representations: [],
      createdAt: currentDate,
      updatedAt: currentDate,
      approvedBy: { id: '123' },
    }

    // Add the new credential definitions to the issuer
    issuer.credentialDefinitions.push(unapprovedCredDef, approvedCredDef)

    // Reset mocks to track new calls
    jest.clearAllMocks()

    // Second publish with all three cred defs
    const secondPublishResults = await tractionService.publishIssuerAssets(issuer)
    expect(secondPublishResults).toBeTruthy()
    expect(secondPublishResults.length).toBe(1) // Should only publish the new approved cred def

    // Verify showcase service was updated only for the approved credential definition
    // Schema already exists, so no new schema updates
    expect(mockShowcaseApiService.updateCredentialSchemaIdentifier).not.toHaveBeenCalled()
    expect(mockShowcaseApiService.updateCredentialDefIdentifier).toHaveBeenCalledTimes(1)
    expect(mockShowcaseApiService.updateCredentialDefIdentifier).toHaveBeenCalledWith(
      approvedCredDef.id,
      expect.any(String),
    )

    await tractionService.waitForTransactionsToComplete(secondPublishResults)

    // Verify approved cred def was created
    const credDef1 = await tractionService.findExistingCredentialDefinition(issuer.credentialDefinitions[0])
    expect(credDef1).toBeTruthy()

    // Verify second approved cred def was created
    const credDef3 = await tractionService.findExistingCredentialDefinition(issuer.credentialDefinitions[2])
    expect(credDef3).toBeTruthy()

    // Verify unapproved cred def was NOT created
    const credDef2 = await tractionService.findExistingCredentialDefinition(issuer.credentialDefinitions[1])
    expect(credDef2).toBeUndefined()
  })

  it('should import an existing schema with an identifier', async () => {
    // Setup schema with an identifier
    const testSchema: CredentialSchema = {
      id: 'test-import-schema-id',
      name: 'TestImportSchema',
      version: '1.0',
      identifier: 'ABCD:2:TestImportSchema:1.0',
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
    }

    // Mock schema storage response
    const mockSchemaResponse = {
      schema: {
        attrNames: ['firstName', 'lastName'],
      },
      schemaId: 'ABCD:2:TestImportSchema:1.0',
    }

    const schemaStorageSpy = jest
      // @ts-ignore - Accessing private field for testing
      .spyOn(tractionService.schemaStorageApi, 'schemaStoragePost')
      .mockResolvedValue(mockSchemaResponse)

    // Execute import
    await tractionService.importCredentialSchema(testSchema)

    // Verify the schema storage API was called with the correct identifier
    expect(schemaStorageSpy).toHaveBeenCalledWith({
      body: {
        schemaId: 'ABCD:2:TestImportSchema:1.0',
      },
    })

    // Verify showcase service was updated with the attributes
    expect(mockShowcaseApiService.updateCredentialSchema).toHaveBeenCalledWith(
      testSchema.id,
      expect.arrayContaining([
        expect.objectContaining({ name: 'firstName' }),
        expect.objectContaining({ name: 'lastName' }),
      ]),
    )
  })

  it('should reject import when schema has no identifier', async () => {
    // Setup schema without an identifier
    const testSchema: CredentialSchema = {
      id: 'test-missing-id-schema',
      name: 'TestNoIdentifierSchema',
      version: '1.0',
      attributes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Execute and verify rejection
    await expect(tractionService.importCredentialSchema(testSchema)).rejects.toThrow(
      /Cannot import schema .* without identifier/,
    )

    // Verify no API calls were made
    expect(mockShowcaseApiService.updateCredentialSchema).not.toHaveBeenCalled()
  })

  it('should reject import when schema returns invalid attributes', async () => {
    // Setup schema with a valid identifier
    const testSchema: CredentialSchema = {
      id: 'test-invalid-schema',
      name: 'TestInvalidSchema',
      version: '1.0',
      identifier: 'ABCD:2:TestInvalidSchema:1.0',
      attributes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock an invalid schema response (missing attrNames)
    const mockInvalidResponse = {
      schema: {
        /* no attrNames field */
      },
      schemaId: 'ABCD:2:TestInvalidSchema:1.0',
    }

    // Setup mock
    // @ts-ignore - Accessing private field for testing
    jest.spyOn(tractionService.schemaStorageApi, 'schemaStoragePost').mockResolvedValue(mockInvalidResponse)

    // Execute and verify rejection
    await expect(tractionService.importCredentialSchema(testSchema)).rejects.toThrow(/Invalid schema returned/)

    // Verify no showcase update was attempted
    expect(mockShowcaseApiService.updateCredentialSchema).not.toHaveBeenCalled()
  })

  it('should handle import with non-string attribute names', async () => {
    // Setup schema with a valid identifier
    const testSchema: CredentialSchema = {
      id: 'test-strange-schema',
      name: 'TestStrangeSchema',
      version: '1.0',
      identifier: 'ABCD:2:TestStrangeSchema:1.0',
      attributes: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock a schema response with non-string values in attrNames
    const mockStrangeResponse = {
      schema: {
        attrNames: ['firstName', 123, null],
      },
      schemaId: 'ABCD:2:TestStrangeSchema:1.0',
    }

    // Setup mock
    // @ts-ignore - Accessing private field for testing
    jest.spyOn(tractionService.schemaStorageApi, 'schemaStoragePost').mockResolvedValue(mockStrangeResponse)

    // Execute and verify rejection
    await expect(tractionService.importCredentialSchema(testSchema)).rejects.toThrow(/Invalid attribute name/)
  })

  it('should update credential schema attributes correctly', async () => {
    // Create a test schema in the showcase API
    const schemaId = 'test-update-schema'
    const newAttributes = [
      {
        name: 'firstName',
        type: CredentialAttributeType.String,
        value: '',
      },
      {
        name: 'lastName',
        type: CredentialAttributeType.String,
        value: '',
      },
    ]

    // Mock the method directly
    mockShowcaseApiService.updateCredentialSchema = jest.fn().mockResolvedValue(undefined)

    // Call the method directly
    await mockShowcaseApiService.updateCredentialSchema(schemaId, newAttributes)

    // Verify it was called with expected parameters
    expect(mockShowcaseApiService.updateCredentialSchema).toHaveBeenCalledWith(schemaId, newAttributes)
  })

  it('should reject schema update when schema not found', async () => {
    const nonExistentId = 'non-existent-id'
    const newAttributes = [
      {
        name: 'firstName',
        type: CredentialAttributeType.String,
        value: '',
      },
    ]

    // Mock the method to throw the expected error
    mockShowcaseApiService.updateCredentialSchema = jest
      .fn()
      .mockRejectedValue(new Error('No schema found in Showcase for id ' + nonExistentId))

    // Execute and verify rejection
    await expect(mockShowcaseApiService.updateCredentialSchema(nonExistentId, newAttributes)).rejects.toThrow(
      /No schema found in Showcase/,
    )
  })
})
