import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import {
  Asset,
  CredentialDefinition,
  CredentialType,
  IdentifierType,
  NewCredentialDefinition,
  RelyingPartyType,
  Tenant,
} from '../../../types'
import * as schema from '../../schema'
import CredentialDefinitionRepository from '../CredentialDefinitionRepository'
import RelyingPartyRepository from '../RelyingPartyRepository'
import { createTestAsset, createTestCredentialSchema, createTestTenant } from './dbTestData'

describe('Database relying party repository tests', (): void => {
  let client: PGlite
  let repository: RelyingPartyRepository
  let credentialDefinition: CredentialDefinition
  let asset: Asset
  let tenant: Tenant

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(RelyingPartyRepository)

    // Create prerequisites using test utilities
    asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    tenant = await createTestTenant()

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const newCredentialDefinition: NewCredentialDefinition = {
      name: 'Test Definition',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      tenantId: tenant.id, // Using the tenant ID

      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      // revocation: { // TODO SHOWCASE-80 AnonCredRevocation
      //     title: 'example_revocation_title',
      //     description: 'example_revocation_description'
      // }
    }
    credentialDefinition = await credentialDefinitionRepository.create(newCredentialDefinition)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save relying party to database', async (): Promise<void> => {
    const relyingPartyData = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const savedRelyingParty = await repository.create(relyingPartyData)

    expect(savedRelyingParty).toBeDefined()
    expect(savedRelyingParty.name).toEqual(relyingPartyData.name)
    expect(savedRelyingParty.type).toEqual(relyingPartyData.type)
    expect(savedRelyingParty.organization).toEqual(relyingPartyData.organization)
    expect(savedRelyingParty.logo).toBeDefined()
    expect(savedRelyingParty.logo!.id).toBeDefined()
    expect(savedRelyingParty.credentialDefinitions.length).toBe(1)
    expect(savedRelyingParty.credentialDefinitions[0].id).toEqual(credentialDefinition.id)
  })

  it('Should get relying party by id from database', async (): Promise<void> => {
    const relyingPartyData = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const savedRelyingParty = await repository.create(relyingPartyData)
    expect(savedRelyingParty).toBeDefined()

    const fromDb = await repository.findById(savedRelyingParty.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(relyingPartyData.name)
    expect(fromDb.description).toEqual(relyingPartyData.description)
    expect(fromDb.credentialDefinitions.length).toBe(1)
    expect(fromDb.credentialDefinitions[0].id).toEqual(credentialDefinition.id)
  })

  it('Should get all relying parties from database', async (): Promise<void> => {
    const relyingPartyData = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const savedRelyingParty1 = await repository.create(relyingPartyData)
    expect(savedRelyingParty1).toBeDefined()

    const savedRelyingParty2 = await repository.create(relyingPartyData)
    expect(savedRelyingParty2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete relying party from database', async (): Promise<void> => {
    const relyingPartyData = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const savedRelyingParty = await repository.create(relyingPartyData)
    expect(savedRelyingParty).toBeDefined()

    await repository.delete(savedRelyingParty.id)

    const deleted = await repository.findById(savedRelyingParty.id)
    expect(deleted).toBeNull()
  })

  it('Should update relying party in database', async (): Promise<void> => {
    const relyingPartyData = {
      name: 'Test Relying Party',
      description: 'Test relying party description',
      type: RelyingPartyType.ARIES,
      organization: 'Test Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    }

    const savedRelyingParty = await repository.create(relyingPartyData)
    expect(savedRelyingParty).toBeDefined()

    const updatedRelyingParty = await repository.update(savedRelyingParty.id, {
      name: 'Updated Name',
      description: 'Updated description',
      type: RelyingPartyType.ARIES,
      organization: 'Updated Organization',
      logo: asset.id,
      credentialDefinitions: [credentialDefinition.id],
    })

    expect(updatedRelyingParty).toBeDefined()
    expect(updatedRelyingParty.name).toEqual('Updated Name')
    expect(updatedRelyingParty.description).toEqual('Updated description')
    expect(updatedRelyingParty.organization).toEqual('Updated Organization')
    expect(updatedRelyingParty.credentialDefinitions.length).toBe(1)
  })

  it('Should throw error when accessing non-existent relying party', async (): Promise<void> => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'

    // This assumes findById returns null for non-existent IDs based on the persona.repository.test.ts pattern
    const result = await repository.findById(nonExistentId)
    expect(result).toBeNull()
  })
})
