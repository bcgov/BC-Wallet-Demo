import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { drizzle } from 'drizzle-orm/pglite'
import { Container } from 'typedi'

import DatabaseService from '../../../services/DatabaseService'
import {
  Asset,
  CredentialAttributeType,
  CredentialSchema,
  CredentialType,
  IdentifierType,
  NewAsset,
  NewCredentialDefinition,
  NewCredentialSchema,
  NewUser,
  User,
} from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../AssetRepository'
import CredentialDefinitionRepository from '../CredentialDefinitionRepository'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import UserRepository from '../UserRepository' // Import UserRepository

// Helper to check if a date is recent (within the last N seconds)
const isRecentDate = (date: Date | null | undefined, seconds = 5): boolean => {
  if (!date) return false
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return diff >= 0 && diff < seconds * 1000
}

describe('Database credential definition repository tests', (): void => {
  let client: PGlite
  let database: NodePgDatabase
  let credentialDefinitionRepository: CredentialDefinitionRepository
  let credentialSchemaRepository: CredentialSchemaRepository
  let userRepository: UserRepository
  let testUser: User
  let asset: Asset
  let credentialSchema: CredentialSchema

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)

    userRepository = Container.get(UserRepository)
    credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const assetRepository = Container.get(AssetRepository)

    const newUser: NewUser = {
      identifierType: IdentifierType.DID, // Or null if not required
      identifier: `did:example:testuser${Date.now()}`, // Unique identifier
    }
    testUser = await userRepository.create(newUser)

    // Create a test asset
    const newAsset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }
    asset = await assetRepository.create(newAsset)

    // Create a test credential schema
    const newCredentialSchema: NewCredentialSchema = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      attributes: [
        { name: 'example_attribute_name1', value: 'example_attribute_value1', type: CredentialAttributeType.STRING },
        { name: 'example_attribute_name2', value: 'example_attribute_value2', type: CredentialAttributeType.STRING },
      ],
    }
    credentialSchema = await credentialSchemaRepository.create(newCredentialSchema)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save credential definition to database with null approval fields', async (): Promise<void> => {
    const credentialDefinition: NewCredentialDefinition = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      //revocation: {
      // TODO SHOWCASE-80 AnonCredRevocation
      //title: 'example_revocation_title',
      //     description: 'example_revocation_description',
      // },
    }

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)

    expect(savedCredentialDefinition).toBeDefined()
    expect(savedCredentialDefinition.name).toEqual(credentialDefinition.name)
    expect(savedCredentialDefinition.version).toEqual(credentialDefinition.version)
    expect(savedCredentialDefinition.icon).toBeDefined()
    expect(savedCredentialDefinition.icon!.id).toEqual(asset.id)

    // Verify approval fields are initially null/undefined
    expect(savedCredentialDefinition.approvedBy).toBeNull()
    expect(savedCredentialDefinition.approvedAt).toBeNull()

    // TODO SHOWCASE-81 representations
    //expect(savedCredentialDefinition.representations.length).toEqual(2)
    // TODO SHOWCASE-80 AnonCredRevocation
    // expect(savedCredentialDefinition.revocation).not.toBeNull()
    // expect(savedCredentialDefinition.revocation!.title).toEqual(credentialDefinition.revocation!.title)
    // expect(savedCredentialDefinition.revocation!.description).toEqual(credentialDefinition.revocation!.description)
  })

  it('Should approve a credential definition', async (): Promise<void> => {
    const credentialDefinition: NewCredentialDefinition = {
      name: 'to_approve',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      //revocation: {
      // TODO SHOWCASE-80 AnonCredRevocation
      //title: 'example_revocation_title',
      //     description: 'example_revocation_description',
      // },
    }

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    expect(savedCredentialDefinition.approvedBy).toBeNull()
    expect(savedCredentialDefinition.approvedAt).toBeNull()

    const approvedDefinition = await credentialDefinitionRepository.approve(savedCredentialDefinition.id, testUser.id)

    expect(approvedDefinition).toBeDefined()
    expect(approvedDefinition.id).toEqual(savedCredentialDefinition.id)
    expect(approvedDefinition.approvedBy).toBeDefined()
    expect(approvedDefinition.approvedBy?.id).toEqual(testUser.id)
    expect(approvedDefinition.approvedBy?.userName).toEqual(testUser.userName) // Check some user fields
    expect(approvedDefinition.approvedAt).toBeDefined()
    expect(isRecentDate(approvedDefinition.approvedAt)).toBe(true)

    // Verify persistence
    const fromDb = await credentialDefinitionRepository.findById(savedCredentialDefinition.id)
    expect(fromDb.approvedBy?.id).toEqual(testUser.id)
    expect(isRecentDate(fromDb.approvedAt)).toBe(true)
  })

  it('Should get credential definition by id including approval status', async (): Promise<void> => {
    // 1. Create and save
    const credentialDefinition: NewCredentialDefinition = {
      name: 'approved_def',
      version: '1.1',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      //revocation: {
      // TODO SHOWCASE-80 AnonCredRevocation
      //title: 'example_revocation_title',
      //     description: 'example_revocation_description',
      // },
    }

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)

    // 2. Approve it
    await credentialDefinitionRepository.approve(savedCredentialDefinition.id, testUser.id)

    // 3. Fetch by ID
    const fromDb = await credentialDefinitionRepository.findById(savedCredentialDefinition.id)

    // 4. Assert
    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(credentialDefinition.name)
    expect(fromDb.icon).toBeDefined()
    expect(fromDb.icon!.id).toEqual(asset.id)
    expect(fromDb.approvedBy).toBeDefined()
    expect(fromDb.approvedBy?.id).toEqual(testUser.id)
    expect(fromDb.approvedAt).toBeDefined()
    expect(isRecentDate(fromDb.approvedAt)).toBe(true)
  })

  it('Should get all credential definitions including approval status', async (): Promise<void> => {
    // 1. Create unapproved
    const cd1: NewCredentialDefinition = {
      name: 'unapproved_cd',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    const savedCd1 = await credentialDefinitionRepository.create(cd1)

    // 2. Create and approve
    const cd2: NewCredentialDefinition = {
      name: 'approved_cd',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    let savedCd2 = await credentialDefinitionRepository.create(cd2)
    savedCd2 = await credentialDefinitionRepository.approve(savedCd2.id, testUser.id)

    // 3. Fetch all
    const fromDb = await credentialDefinitionRepository.findAll()

    // 4. Assert
    expect(fromDb.length).toEqual(2)

    const fetchedCd1 = fromDb.find((cd) => cd.id === savedCd1.id)
    const fetchedCd2 = fromDb.find((cd) => cd.id === savedCd2.id)

    expect(fetchedCd1).toBeDefined()
    expect(fetchedCd1?.name).toEqual(cd1.name)
    expect(fetchedCd1?.approvedBy).toBeNull()
    expect(fetchedCd1?.approvedAt).toBeNull()

    expect(fetchedCd2).toBeDefined()
    expect(fetchedCd2?.name).toEqual(cd2.name)
    expect(fetchedCd2?.approvedBy).toBeDefined()
    expect(fetchedCd2?.approvedBy?.id).toEqual(testUser.id)
    expect(fetchedCd2?.approvedAt).toBeDefined()
    expect(isRecentDate(fetchedCd2?.approvedAt)).toBe(true)
  })

  it('Should find only unapproved credential definitions', async (): Promise<void> => {
    // 1. Create unapproved
    const cd1: NewCredentialDefinition = {
      name: 'unapproved_cd_only',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    const savedCd1 = await credentialDefinitionRepository.create(cd1)

    // 2. Create and approve
    const cd2: NewCredentialDefinition = {
      name: 'approved_cd_not_found',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    let savedCd2 = await credentialDefinitionRepository.create(cd2)
    await credentialDefinitionRepository.approve(savedCd2.id, testUser.id)

    // 3. Fetch unapproved
    const unapproved = await credentialDefinitionRepository.findUnapproved()

    // 4. Assert
    expect(unapproved.length).toEqual(1)
    expect(unapproved[0].id).toEqual(savedCd1.id)
    expect(unapproved[0].name).toEqual(cd1.name)
    expect(unapproved[0].approvedBy).toBeNull()
    expect(unapproved[0].approvedAt).toBeNull()
  })

  it('Should update credential definition without affecting existing approval status', async (): Promise<void> => {
    // 1. Create and approve
    const credentialDefinition: NewCredentialDefinition = {
      name: 'to_update_approved',
      version: 'initial_version',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      icon: asset.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ]
    }
    let savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    savedCredentialDefinition = await credentialDefinitionRepository.approve(savedCredentialDefinition.id, testUser.id)
    const originalApprovalTime = savedCredentialDefinition.approvedAt

    // 2. Update a different field
    const newName = 'updated_name_approved'
    const updatePayload: NewCredentialDefinition = {
      // Spread original *creation* data, not the approved state
      ...credentialDefinition,
      name: newName,
    }
    const updatedDefinition = await credentialDefinitionRepository.update(savedCredentialDefinition.id, updatePayload)

    // 3. Assert
    expect(updatedDefinition).toBeDefined()
    expect(updatedDefinition.name).toEqual(newName) // Name is updated
    expect(updatedDefinition.version).toEqual(credentialDefinition.version) // Version is unchanged
    expect(updatedDefinition.icon?.id).toEqual(asset.id) // Icon is unchanged

    // Verify approval status is PERSISTED
    expect(updatedDefinition.approvedBy).toBeDefined()
    expect(updatedDefinition.approvedBy?.id).toEqual(testUser.id)
    expect(updatedDefinition.approvedAt).toBeDefined()
    // Check the timestamp is the *original* approval time, not modified by the update
    expect(updatedDefinition.approvedAt?.toISOString()).toEqual(originalApprovalTime?.toISOString())
  })

  it('Should update credential definition that was not approved', async (): Promise<void> => {
    // 1. Create unapproved
    const credentialDefinition: NewCredentialDefinition = {
      name: 'to_update_unapproved',
      version: 'initial_version',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      //revocation: {
      // TODO SHOWCASE-80 AnonCredRevocation
      //title: 'example_revocation_title',
      //     description: 'example_revocation_description',
      // },
    }

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)

    // 2. Update a different field
    const newName = 'updated_name_unapproved'
    const updatePayload: NewCredentialDefinition = {
      ...credentialDefinition,
      name: newName,
    }
    const updatedDefinition = await credentialDefinitionRepository.update(savedCredentialDefinition.id, updatePayload)

    // 3. Assert
    expect(updatedDefinition).toBeDefined()
    expect(updatedDefinition.name).toEqual(newName) // Name is updated
    // Verify approval status is still null/undefined
    expect(updatedDefinition.approvedBy).toBeNull()
    expect(updatedDefinition.approvedAt).toBeNull()
  })

  // --- Keep existing tests for other functionality (delete, invalid icon, etc.) ---
  it('Should save the credential definition without icon to database', async (): Promise<void> => {
    const credentialDefinition: NewCredentialDefinition = {
      name: 'example_name_no_icon',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
      // representations: [
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     },
      //     { // TODO SHOWCASE-81 OCARepresentation
      //
      //     }
      // ],
      //revocation: {
      // TODO SHOWCASE-80 AnonCredRevocation
      //title: 'example_revocation_title',
      //     description: 'example_revocation_description',
      // },
    }

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    expect(savedCredentialDefinition).toBeDefined()
    expect(savedCredentialDefinition.name).toEqual(credentialDefinition.name)
    expect(savedCredentialDefinition.icon).toBeUndefined()
    expect(savedCredentialDefinition.approvedBy).toBeNull()
    expect(savedCredentialDefinition.approvedAt).toBeNull()
  })

  it('Should throw error when saving credential definition with invalid icon id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const credentialDefinition: NewCredentialDefinition = {
      name: 'invalid_icon_test',
      version: '1.0',
      icon: unknownIconId,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    await expect(credentialDefinitionRepository.create(credentialDefinition)).rejects.toThrowError(
      `No asset found for id: ${unknownIconId}`,
    )
  })

  it('Should delete credential definition from database', async (): Promise<void> => {
    const credentialDefinition: NewCredentialDefinition = {
      name: 'to_delete',
      version: '1.0',
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    await credentialDefinitionRepository.delete(savedCredentialDefinition.id)
    await expect(credentialDefinitionRepository.findById(savedCredentialDefinition.id)).rejects.toThrowError(
      `No credential definition found for id: ${savedCredentialDefinition.id}`,
    )
  })

  it('Should throw error when updating credential definition with invalid icon id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const credentialDefinition: NewCredentialDefinition = {
      name: 'update_invalid_icon',
      version: '1.0',
      icon: asset.id, // Start with a valid icon
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    }
    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    const updatePayload: NewCredentialDefinition = {
      ...credentialDefinition, // Use original creation data
      icon: unknownIconId, // Set invalid icon for update
    }
    await expect(
      credentialDefinitionRepository.update(savedCredentialDefinition.id, updatePayload),
    ).rejects.toThrowError(
      `insert or update on table "credentialDefinition" violates foreign key constraint "credentialDefinition_icon_asset_id_fk"`,
    )
  })

  it('Should update credential definition removing the icon', async (): Promise<void> => {
    const credentialDefinition: NewCredentialDefinition = {
      name: 'remove_icon_update',
      version: '1.0',
      icon: asset.id, // Start with an icon
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
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

    const savedCredentialDefinition = await credentialDefinitionRepository.create(credentialDefinition)
    expect(savedCredentialDefinition.icon).toBeDefined()

    const updatePayload: NewCredentialDefinition = {
      ...credentialDefinition,
      icon: null, // Remove icon in update
    }
    const updatedDefinition = await credentialDefinitionRepository.update(savedCredentialDefinition.id, updatePayload)

    expect(updatedDefinition).toBeDefined()
    expect(updatedDefinition.name).toEqual(credentialDefinition.name)
    expect(updatedDefinition.icon).toBeUndefined() // Icon should now be undefined
  })
})
