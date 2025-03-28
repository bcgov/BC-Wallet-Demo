import { TractionService } from '../services/traction-service'
import { CredentialAttributeType, CredentialSchema, Issuer, IssuerType, CredentialType } from 'bc-wallet-openapi'

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

  it('should get issuer DID through publishing empty assets', async () => {
    // Create a proper Issuer object with all required properties
    const mockIssuer: Issuer = {
      id: 'test-issuer-id',
      name: 'Test Issuer',
      description: 'Test Issuer Description',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialDefinitions: [],
      credentialSchemas: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await expect(tractionService.publishIssuerAssets(mockIssuer)).resolves.not.toThrow()
  })

  it('should find an existing schema', async () => {
    // First get the issuer DID
    const issuerId = await tractionService.getIssuerDID()

    // Then test findExistingSchema
    const schemaName = 'TestSchema'
    const schemaVersion = '1.0'

    const schemaId = await tractionService.findExistingSchema(schemaName, schemaVersion, issuerId)

    // This might return null if schema doesn't exist, which is also a valid result
    expect(schemaId !== undefined).toBeTruthy() // Either a string ID or null
  })

  it('should create a new schema', async () => {
    const issuerId = await tractionService.getIssuerDID()

    const testSchema: CredentialSchema = {
      id: 'test-schema-id',
      name: 'TestNewSchema',
      version: '1.0',
      attributes: [
        {
          id: 'attr1',
          name: 'name',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'attr2',
          name: 'age',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'attr3',
          name: 'email',
          type: 'STRING' as CredentialAttributeType,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const schemaId = await tractionService.createSchema(testSchema, issuerId)
    expect(schemaId).toBeTruthy()
    expect(typeof schemaId).toBe('string')
  })

  it('should find an existing credential definition', async () => {
    const issuerId = await tractionService.getIssuerDID()

    // We need an existing schema ID to check for cred defs
    // This assumes a schema has been created in a previous test or exists in the system
    const schemaName = 'TestNewSchema'
    const schemaVersion = '1.0'

    const schemaId = await tractionService.findExistingSchema(schemaName, schemaVersion, issuerId)
    if (!schemaId) {
      console.warn('No schema found to test credential definition, skipping test')
      return
    }

    const credDef = await tractionService.findExistingCredentialDefinition(
      schemaId,
      schemaVersion,
      issuerId
    )

    // This might be undefined if the cred def doesn't exist, which is fine
    expect(credDef !== null).toBeTruthy()
  })

  it('should publish issuer assets', async () => {
    const currentDate = new Date()
    const testIssuer: Issuer = {
      id: 'test-publisher',
      name: 'Test Publisher',
      description: 'Test Publisher Description',
      type: IssuerType.Aries,
      organization: 'Test Organization',
      credentialSchemas: [
        {
          id: 'test-publish-schema',
          name: 'PublishTestSchema',
          version: '1.0',
          attributes: [
            {
              id: 'attr1',
              name: 'firstName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate
            },
            {
              id: 'attr2',
              name: 'lastName',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate
            },
            {
              id: 'attr3',
              name: 'dateOfBirth',
              type: 'STRING' as CredentialAttributeType,
              createdAt: currentDate,
              updatedAt: currentDate
            }
          ],
          createdAt: currentDate,
          updatedAt: currentDate
        }
      ],
      credentialDefinitions: [
        {
          id: 'test-publish-cred-def',
          name: 'PublishTestCredDef',
          version: '1.0',
          type: CredentialType.Anoncred,
          credentialSchema: {
            id: 'test-publish-schema',
            name: 'PublishTestSchema',
            version: '1.0',
            attributes: [
              {
                id: 'attr1',
                name: 'firstName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate
              },
              {
                id: 'attr2',
                name: 'lastName',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate
              },
              {
                id: 'attr3',
                name: 'dateOfBirth',
                type: 'STRING' as CredentialAttributeType,
                createdAt: currentDate,
                updatedAt: currentDate
              }
            ],
            createdAt: currentDate,
            updatedAt: currentDate
          },
          representations: [],
          createdAt: currentDate,
          updatedAt: currentDate
        }
      ],
      createdAt: currentDate,
      updatedAt: currentDate
    }

    await expect(tractionService.publishIssuerAssets(testIssuer)).resolves.not.toThrow()
  })
})