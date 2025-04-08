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

    const schemaId = await tractionService.createSchema(testSchema)
    expect(schemaId).toBeTruthy()
    expect(typeof schemaId).toBe('string')

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
        },
      ],
      createdAt: currentDate,
      updatedAt: currentDate,
    }

    const publishResults = tractionService.publishIssuerAssets(testIssuer)
    await expect(publishResults).resolves.not.toThrow()


    const credDef = await tractionService.findExistingCredentialDefinition(testIssuer.credentialDefinitions[0])
    expect(credDef).toBeTruthy()
  })
})
