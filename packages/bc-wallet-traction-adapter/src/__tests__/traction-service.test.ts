import { TractionService } from '../services/traction-service'
import { CredentialAttributeType, CredentialSchema, CredentialType, Issuer, IssuerType } from 'bc-wallet-openapi'
import short from 'short-uuid'

describe('TractionService Integration Test', () => {
  let tractionService: TractionService
  const apiBasePath = 'http://localhost:8031'

  beforeEach(async () => {
    // Get credentials from environment variables
    const tenantId = process.env.TRACTION_TENANT_ID
    const walletId = process.env.TRACTION_WALLET_ID
    const apiKey = process.env.TRACTION_API_KEY

    if (!tenantId || !apiKey) {
      throw new Error('Required environment variables TRACTION_TENANT_ID and TRACTION_API_KEY must be set')
    }

    // Initialize service
    tractionService = new TractionService(tenantId, apiBasePath, walletId)

    // Get and set token
    try {
      const token = await tractionService.getTenantToken(apiKey)
      tractionService.updateBearerToken(token)
    } catch (error) {
      console.error('Failed to get tenant token:', error)
      throw error
    }
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

  it('should create a new schema', async () => {
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

    if (schemaResult.transactionId) {
      await tractionService.waitForTransactionsToComplete([schemaResult.transactionId])
    }

    const foundSchemaId = await tractionService.findExistingSchema(testSchema.name, testSchema.version)
    expect(foundSchemaId).toBeTruthy()
  })

  it('should publish issuer assets', async () => {
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

    await tractionService.waitForTransactionsToComplete(publishResults)

    const credDef = await tractionService.findExistingCredentialDefinition(testIssuer.credentialDefinitions[0])
    expect(credDef).toBeTruthy()
  })

  it('should handle publishing when schema already exists', async () => {
    const currentDate = new Date()
    const uniqueSuffix = short.generate()
    const schemaName = 'ExistingSchemaTest_' + uniqueSuffix

    // Create an issuer with only the schema
    const schemaOnlyIssuer: Issuer = {
      id: 'schema-only-publisher',
      name: 'Schema Only Publisher_' + uniqueSuffix,
      description: 'Test Schema Only Publisher',
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
      credentialDefinitions: [],
      createdAt: currentDate,
      updatedAt: currentDate,
    }

    // First publish only the schema
    const firstPublishResults = await tractionService.publishIssuerAssets(schemaOnlyIssuer)
    expect(firstPublishResults).toBeTruthy()
    expect(firstPublishResults.length).toBe(1) // Should only have one transaction for the schema

    await tractionService.waitForTransactionsToComplete(firstPublishResults)

    // Verify schema exists
    const foundSchemaId = await tractionService.findExistingSchema(schemaName, '1.0')
    expect(foundSchemaId).toBeTruthy()
    expect(schemaOnlyIssuer.credentialSchemas[0].identifier).toBe(foundSchemaId)

    // Now create an issuer with both schema and cred def
    const completeIssuer: Issuer = {
      id: 'complete-publisher',
      name: 'Complete Publisher_' + uniqueSuffix,
      description: 'Test Complete Publisher',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialSchemas: [
        {
          ...schemaOnlyIssuer.credentialSchemas[0], // Reuse same schema (should be detected as existing)
        },
      ],
      credentialDefinitions: [
        {
          id: 'test-publish-cred-def',
          name: 'ExistingSchemaCredDef_' + uniqueSuffix,
          version: '1.0',
          type: CredentialType.Anoncred,
          credentialSchema: {
            ...schemaOnlyIssuer.credentialSchemas[0], // Reference the same schema
          },
          representations: [],
          createdAt: currentDate,
          updatedAt: currentDate,
          approvedBy: { id: '123' }
        },
      ],
      createdAt: currentDate,
      updatedAt: currentDate
    }

    // Second publish with both schema and cred def
    const secondPublishResults = await tractionService.publishIssuerAssets(completeIssuer)
    expect(secondPublishResults).toBeTruthy()
    expect(secondPublishResults.length).toBe(1) // Should only have one transaction for the cred def

    await tractionService.waitForTransactionsToComplete(secondPublishResults)

    // Verify cred def was created
    const credDef = await tractionService.findExistingCredentialDefinition(completeIssuer.credentialDefinitions[0])
    expect(credDef).toBeTruthy()
    expect(completeIssuer.credentialDefinitions[0].identifier).toBe(credDef)
  })
})
