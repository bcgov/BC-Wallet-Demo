import { TractionService } from '../services/traction-service'
import { CredentialAttributeType, CredentialSchema, CredentialType, Issuer, IssuerType } from 'bc-wallet-openapi'
import short from 'short-uuid'
import * as process from 'node:process'

const isTractionAvailable = () => {
  const tractionAvailable = process.env.TRACTION_AVAILABLE
  return tractionAvailable && tractionAvailable !== 'false' && tractionAvailable !== '0'
}

const describeIfTractionAvailable = isTractionAvailable() ? describe : describe.skip

describeIfTractionAvailable('TractionService Integration Test', () => {
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

    // First publish approved credential definition and schema
    const firstPublishResults = await tractionService.publishIssuerAssets(issuer)
    expect(firstPublishResults).toBeTruthy()
    expect(firstPublishResults.length).toBe(2) // Schema + first cred def

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

    // Second publish with all three cred defs
    const secondPublishResults = await tractionService.publishIssuerAssets(issuer)
    expect(secondPublishResults).toBeTruthy()
    expect(secondPublishResults.length).toBe(1) // Should only publish the new approved cred def

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
})
