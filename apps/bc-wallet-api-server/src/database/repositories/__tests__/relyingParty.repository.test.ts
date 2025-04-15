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
  CredentialDefinition,
  CredentialSchema,
  CredentialType,
  IdentifierType,
  NewAsset,
  NewCredentialDefinition,
  NewCredentialSchema,
  NewRelyingParty,
  RelyingPartyType,
} from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../AssetRepository'
import CredentialDefinitionRepository from '../CredentialDefinitionRepository'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import RelyingPartyRepository from '../RelyingPartyRepository'

describe('Database relying party repository tests', (): void => {
  let client: PGlite
  let repository: RelyingPartyRepository
  let credentialSchema: CredentialSchema
  let credentialDefinition1: CredentialDefinition
  let credentialDefinition2: CredentialDefinition
  let asset: Asset

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    repository = Container.get(RelyingPartyRepository)
    const assetRepository = Container.get(AssetRepository)
    const newAsset: NewAsset = {
      mediaType: 'image/png',
      fileName: 'image.png',
      description: 'some image',
      content: Buffer.from('some binary data'),
    }
    asset = await assetRepository.create(newAsset)
    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)

    const newCredentialSchema: NewCredentialSchema = {
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
    }
    credentialSchema = await credentialSchemaRepository.create(newCredentialSchema)

    const newCredentialDefinition: NewCredentialDefinition = {
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
      // revocation: { // TODO SHOWCASE-80 AnonCredRevocation
      //     title: 'example_revocation_title',
      //     description: 'example_revocation_description'
      // }
    }
    credentialDefinition1 = await credentialDefinitionRepository.create(newCredentialDefinition)
    credentialDefinition2 = await credentialDefinitionRepository.create(newCredentialDefinition)
  })

  afterEach(async (): Promise<void> => {
    await client.close()
    jest.resetAllMocks()
    Container.reset()
  })

  it('Should save relying party to database', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)

    expect(savedRelyingParty).toBeDefined()
    expect(savedRelyingParty.name).toEqual(relyingParty.name)
    expect(savedRelyingParty.type).toEqual(relyingParty.type)
    expect(savedRelyingParty.description).toEqual(relyingParty.description)
    expect(savedRelyingParty.organization).toEqual(relyingParty.organization)
    expect(savedRelyingParty.credentialDefinitions.length).toEqual(2)
    expect(savedRelyingParty.logo).not.toBeNull()
    expect(savedRelyingParty.logo!.id).toBeDefined()
    expect(savedRelyingParty.logo!.mediaType).toEqual(asset.mediaType)
    expect(savedRelyingParty.logo!.fileName).toEqual(asset.fileName)
    expect(savedRelyingParty.logo!.description).toEqual(asset.description)
    expect(savedRelyingParty.logo!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when saving relying party with invalid logo id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: unknownIconId,
    }

    await expect(repository.create(relyingParty)).rejects.toThrowError(`No asset found for id: ${unknownIconId}`)
  })

  it('Should throw error when saving relying party with no credential definitions', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    await expect(repository.create(relyingParty)).rejects.toThrowError(`At least one credential definition is required`)
  })

  it('Should throw error when saving relying party with invalid credential definition id', async (): Promise<void> => {
    const unknownCredentialDefinitionId = '498e1086-a2ac-4189-b951-fe863d0fe9fc'
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [unknownCredentialDefinitionId],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    await expect(repository.create(relyingParty)).rejects.toThrowError(
      `No credential definition found for id: ${unknownCredentialDefinitionId}`,
    )
  })

  it('Should get relying party by id from database', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    const fromDb = await repository.findById(savedRelyingParty.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(relyingParty.name)
    expect(fromDb.type).toEqual(relyingParty.type)
    expect(fromDb.description).toEqual(relyingParty.description)
    expect(fromDb.organization).toEqual(relyingParty.organization)
    expect(fromDb.credentialDefinitions.length).toEqual(2)
    expect(fromDb.logo).not.toBeNull()
    expect(fromDb.logo!.id).toBeDefined()
    expect(fromDb.logo!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.logo!.fileName).toEqual(asset.fileName)
    expect(fromDb.logo!.description).toEqual(asset.description)
    expect(fromDb.logo!.content).toStrictEqual(asset.content)
  })

  it('Should get all relying parties from database', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id],
      description: 'example_description',
      organization: 'example_organization',
    }

    const savedRelyingParty1 = await repository.create(relyingParty)
    expect(savedRelyingParty1).toBeDefined()

    const savedRelyingParty2 = await repository.create(relyingParty)
    expect(savedRelyingParty2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete relying party from database', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id],
      description: 'example_description',
      organization: 'example_organization',
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    await repository.delete(savedRelyingParty.id)

    await expect(repository.findById(savedRelyingParty.id)).rejects.toThrowError(
      `No relying party found for id: ${savedRelyingParty.id}`,
    )
  })

  it('Should update relying party in database', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    const newName = 'new_name'
    const updatedRelyingParty = await repository.update(savedRelyingParty.id, {
      ...savedRelyingParty,
      name: newName,
      credentialDefinitions: [credentialDefinition1.id],
      logo: savedRelyingParty.logo?.id,
    })

    expect(updatedRelyingParty).toBeDefined()
    expect(updatedRelyingParty.name).toEqual(newName)
    expect(updatedRelyingParty.type).toEqual(relyingParty.type)
    expect(updatedRelyingParty.description).toEqual(relyingParty.description)
    expect(updatedRelyingParty.organization).toEqual(relyingParty.organization)
    expect(updatedRelyingParty.credentialDefinitions.length).toEqual(1)
    expect(updatedRelyingParty.logo).not.toBeNull()
    expect(updatedRelyingParty.logo!.id).toBeDefined()
    expect(updatedRelyingParty.logo!.mediaType).toEqual(asset.mediaType)
    expect(updatedRelyingParty.logo!.fileName).toEqual(asset.fileName)
    expect(updatedRelyingParty.logo!.description).toEqual(asset.description)
    expect(updatedRelyingParty.logo!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when updating relying party with invalid logo id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    const updatedRelyingParty: NewRelyingParty = {
      ...savedRelyingParty,
      credentialDefinitions: savedRelyingParty.credentialDefinitions.map(
        (credentialDefinition) => credentialDefinition.id,
      ),
      logo: unknownIconId,
    }

    await expect(repository.update(savedRelyingParty.id, updatedRelyingParty)).rejects.toThrowError(
      `No asset found for id: ${unknownIconId}`,
    )
  })

  it('Should throw error when updating relying party with no credential definitions', async (): Promise<void> => {
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    const updatedRelyingParty: NewRelyingParty = {
      ...savedRelyingParty,
      credentialDefinitions: [],
      logo: asset.id,
    }

    await expect(repository.update(savedRelyingParty.id, updatedRelyingParty)).rejects.toThrowError(
      `At least one credential definition is required`,
    )
  })

  it('Should throw error when updating relying party with invalid credential definition id', async (): Promise<void> => {
    const unknownCredentialDefinitionId = '498e1086-a2ac-4189-b951-fe863d0fe9fc'
    const relyingParty: NewRelyingParty = {
      name: 'example_name',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedRelyingParty = await repository.create(relyingParty)
    expect(savedRelyingParty).toBeDefined()

    const updatedRelyingParty: NewRelyingParty = {
      ...savedRelyingParty,
      credentialDefinitions: [unknownCredentialDefinitionId],
      logo: asset.id,
    }

    await expect(repository.update(savedRelyingParty.id, updatedRelyingParty)).rejects.toThrowError(
      `No credential definition found for id: ${unknownCredentialDefinitionId}`,
    )
  })
})
