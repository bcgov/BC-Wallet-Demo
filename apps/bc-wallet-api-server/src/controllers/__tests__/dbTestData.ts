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
  Persona,
  Scenario,
  StepActionType,
  StepType,
  Tenant,
} from '../../types'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import DatabaseService from '../../services/DatabaseService'
import * as schema from '../../database/schema'
import { migrate } from 'drizzle-orm/node-postgres/migrator'


export async function setupTestDatabase(): Promise<{ client: PGlite, database: NodePgDatabase }> {
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
  schema: CredentialSchema
): Promise<CredentialDefinition> {
  const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
  return credentialDefinitionRepository.create({
    name: 'Test Definition',
    version: '1.0',
    identifierType: IdentifierType.DID,
    identifier: 'did:test:123',
    icon: asset.id,
    type: CredentialType.ANONCRED,
    credentialSchema: schema.id
  })
}

export async function createTestIssuer(
  asset: Asset,
  definition: CredentialDefinition,
  schema: CredentialSchema
): Promise<Issuer> {
  const issuerRepository = Container.get(IssuerRepository)
  return issuerRepository.create({
    name: 'Test Issuer',
    type: IssuerType.ARIES,
    credentialDefinitions: [definition.id],
    credentialSchemas: [schema.id],
    description: 'Test issuer description',
    organization: 'Test Organization',
    logo: asset.id
  })
}
