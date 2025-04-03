import { Container } from 'typedi'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import {
  Asset,
  CredentialAttributeType,
  CredentialDefinition,
  CredentialSchema,
  CredentialType,
  IdentifierType,
  Issuer,
  IssuerType,
  NewCredentialDefinition,
  NewShowcase,
  NewUser,
  Persona,
  Scenario,
  Showcase,
  ShowcaseStatus,
  StepActionType,
  StepType,
  Tenant,
  User,
} from '../../types'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import DatabaseService from '../../services/DatabaseService'
import * as schema from '../../database/schema'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import UserRepository from '../../database/repositories/UserRepository'
import ShowcaseService from '../../services/ShowcaseService'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'

export async function setupTestDatabase(): Promise<{ client: PGlite; database: NodePgDatabase }> {
  const client = new PGlite()
  const database = drizzle(client, { schema }) as unknown as NodePgDatabase
  await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
  return { client, database }
}

export async function createMockDatabaseService(database: NodePgDatabase): Promise<DatabaseService> {
  const mockDatabaseService = {
    getConnection: jest.fn().mockResolvedValue(database),
  }
  return mockDatabaseService as unknown as DatabaseService
}

export async function createTestAsset(): Promise<Asset> {
  const assetRepository = Container.get(AssetRepository)
  return assetRepository.create({
    mediaType: 'image/png',
    fileName: 'test.png',
    description: 'Test image',
    content: Buffer.from('binary data'),
  })
}

export async function createTestAssetWithContent(
  content: Buffer,
  mediaType = 'image/png',
  fileName = 'test.png',
  description = 'Test image',
): Promise<Asset> {
  const assetRepository = Container.get(AssetRepository)
  return assetRepository.create({
    mediaType,
    fileName,
    content,
    description,
  })
}

export async function createTestCredentialSchema(): Promise<CredentialSchema> {
  const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
  return credentialSchemaRepository.create({
    name: 'example_name',
    version: 'example_version',
    identifierType: IdentifierType.DID,
    identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
    attributes: [
      {
        name: 'example_attribute_name1',
        value: 'example_attribute_value1',
        type: CredentialAttributeType.STRING,
      },
      {
        name: 'example_attribute_name2',
        value: 'example_attribute_value2',
        type: CredentialAttributeType.STRING,
      },
    ],
  })
}

export async function createTestPersona(asset?: Asset): Promise<Persona> {
  const personaRepository = Container.get(PersonaRepository)
  return personaRepository.create({
    name: 'Test Persona',
    role: 'Test Role',
    description: 'Test description',
    headshotImage: asset?.id,
    bodyImage: asset?.id,
    hidden: false,
  })
}

export async function createTestScenario(asset: Asset, persona: Persona, issuer: Issuer): Promise<Scenario> {
  const scenarioRepository = Container.get(ScenarioRepository)
  return scenarioRepository.create({
    name: 'Test Scenario',
    description: 'Test scenario description',
    issuer: issuer.id,
    steps: [
      {
        title: 'Test Step',
        description: 'Test step description',
        order: 1,
        type: StepType.HUMAN_TASK,
        asset: asset.id,
        actions: [
          {
            title: 'Test Action',
            actionType: StepActionType.ARIES_OOB,
            text: 'Test action text',
            proofRequest: {
              attributes: {
                attribute1: {
                  attributes: ['attribute1', 'attribute2'],
                  restrictions: ['restriction1', 'restriction2'],
                },
              },
              predicates: {},
            },
          },
        ],
      },
    ],
    personas: [persona.id],
    hidden: false,
  })
}

export async function createTestTenant(id = 'test-tenant'): Promise<Tenant> {
  const tenantRepository = Container.get(TenantRepository)
  return tenantRepository.create({ id })
}

export async function createTestCredentialDefinition(
  asset: Asset,
  schema: CredentialSchema,
): Promise<CredentialDefinition> {
  const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
  return credentialDefinitionRepository.create({
    name: 'Test Definition',
    version: '1.0',
    identifierType: IdentifierType.DID,
    identifier: 'did:test:123',
    icon: asset.id,
    type: CredentialType.ANONCRED,
    credentialSchema: schema.id,
  })
}

export async function createTestIssuer(
  asset: Asset,
  definition: CredentialDefinition,
  schema: CredentialSchema,
): Promise<Issuer> {
  const issuerRepository = Container.get(IssuerRepository)
  return issuerRepository.create({
    name: 'Test Issuer',
    type: IssuerType.ARIES,
    credentialDefinitions: [definition.id],
    credentialSchemas: [schema.id],
    description: 'Test issuer description',
    organization: 'Test Organization',
    logo: asset.id,
  })
}

export async function createTestUser(
  identifier: string,
  identifierType: IdentifierType = IdentifierType.DID,
): Promise<User> {
  const userRepository = Container.get(UserRepository)
  const newUser: NewUser = {
    identifier: identifier,
    identifierType: identifierType,
  }
  return await userRepository.create(newUser)
}

export async function createTestShowcase(
  tenantId: string,
  name: string,
  status: ShowcaseStatus = ShowcaseStatus.PENDING,
  creatorUserId?: string, // Optional creator ID
): Promise<Showcase> {
  // Returning internal Showcase type after creation
  // Create necessary dependencies using db helpers first
  const asset = await createTestAsset()
  const persona = await createTestPersona(asset)
  const schema = await createTestCredentialSchema()
  // Use renamed db helper
  const definition = await createTestCredentialDefinition(asset, schema)
  const issuer = await createTestIssuer(asset, definition, schema)
  const scenario = await createTestScenario(asset, persona, issuer)

  // Use the ShowcaseService to create the showcase
  const showcaseService = Container.get(ShowcaseService)
  const newShowcase: NewShowcase = {
    name: name,
    description: `${name} description`,
    tenantId: tenantId,
    status: status,
    hidden: false,
    scenarios: [scenario.id],
    personas: [persona.id],
    credentialDefinitions: [definition.id], // Make sure this matches NewShowcase type
    bannerImage: asset.id,
    createdBy: creatorUserId,
  }
  const created = await showcaseService.createShowcase(newShowcase)

  // Re-fetch using repository to ensure relations are populated for return
  // (Service create might not return fully populated relations)
  const showcaseRepository = Container.get(ShowcaseRepository)
  return await showcaseRepository.findById(created.id)
}

// Helper to create a Credential Definition via the service for API testing
export async function createUnapprovedCredDef(name: string): Promise<CredentialDefinition> {
  const asset = await createTestAsset()
  const schema = await createTestCredentialSchema()

  // Use the CredentialDefinitionService
  const credDefService = Container.get(CredentialDefinitionService)
  const newCredDef: NewCredentialDefinition = {
    name: name,
    version: '1.0',
    type: CredentialType.ANONCRED,
    credentialSchema: schema.id,
    icon: asset.id,
  }
  const created = await credDefService.createCredentialDefinition(newCredDef)

  // Re-fetch using repository to ensure relations are populated
  const credentialDefinitionRepo = Container.get(CredentialDefinitionRepository)
  return await credentialDefinitionRepo.findById(created.id)
}
