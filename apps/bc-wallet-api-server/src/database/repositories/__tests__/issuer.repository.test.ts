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
  IssuerType,
  NewAsset,
  NewCredentialDefinition,
  NewCredentialSchema,
  NewIssuer,
} from '../../../types'
import * as schema from '../../schema'
import AssetRepository from '../AssetRepository'
import CredentialDefinitionRepository from '../CredentialDefinitionRepository'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import IssuerRepository from '../IssuerRepository'

describe('Database issuer repository tests', (): void => {
  let client: PGlite
  let repository: IssuerRepository
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
    repository = Container.get(IssuerRepository)
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
      //   { // TODO SHOWCASE-81 OCARepresentation
      //
      //   },
      //   { // TODO SHOWCASE-81 OCARepresentation
      //
      //   }
      // ],
      // revocation: { // TODO SHOWCASE-80 AnonCredRevocation
      //   title: 'example_revocation_title',
      //   description: 'example_revocation_description'
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

  it('Should save issuer to database', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)

    expect(savedIssuer).toBeDefined()
    expect(savedIssuer.name).toEqual(issuer.name)
    expect(savedIssuer.type).toEqual(issuer.type)
    expect(savedIssuer.description).toEqual(issuer.description)
    expect(savedIssuer.organization).toEqual(issuer.organization)
    expect(savedIssuer.credentialDefinitions.length).toEqual(2)
    expect(savedIssuer.logo).not.toBeNull()
    expect(savedIssuer.logo!.id).toBeDefined()
    expect(savedIssuer.logo!.mediaType).toEqual(asset.mediaType)
    expect(savedIssuer.logo!.fileName).toEqual(asset.fileName)
    expect(savedIssuer.logo!.description).toEqual(asset.description)
    expect(savedIssuer.logo!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when saving issuer with invalid logo id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: unknownIconId,
    }

    await expect(repository.create(issuer)).rejects.toThrowError(`No asset found for id: ${unknownIconId}`)
  })

  it('Should throw error when saving issuer with no credential definitions', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    await expect(repository.create(issuer)).rejects.toThrowError(`At least one credential definition is required`)
  })

  it('Should throw error when saving issuer with no credential schemas', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    await expect(repository.create(issuer)).rejects.toThrowError(`At least one credential schema is required`)
  })

  it('Should throw error when saving issuer with invalid credential definition id', async (): Promise<void> => {
    const unknownCredentialDefinitionId = '498e1086-a2ac-4189-b951-fe863d0fe9fc'
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [unknownCredentialDefinitionId],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    await expect(repository.create(issuer)).rejects.toThrowError(
      `No credential definition found for id: ${unknownCredentialDefinitionId}`,
    )
  })

  it('Should get issuer by id from database', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const fromDb = await repository.findById(savedIssuer.id)

    expect(fromDb).toBeDefined()
    expect(fromDb.name).toEqual(issuer.name)
    expect(fromDb.type).toEqual(issuer.type)
    expect(fromDb.description).toEqual(issuer.description)
    expect(fromDb.organization).toEqual(issuer.organization)
    expect(fromDb.credentialDefinitions.length).toEqual(2)
    expect(fromDb.logo).not.toBeNull()
    expect(fromDb.logo!.id).toBeDefined()
    expect(fromDb.logo!.mediaType).toEqual(asset.mediaType)
    expect(fromDb.logo!.fileName).toEqual(asset.fileName)
    expect(fromDb.logo!.description).toEqual(asset.description)
    expect(fromDb.logo!.content).toStrictEqual(asset.content)
  })

  it('Should get all issuers from database', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
    }

    const savedIssuer1 = await repository.create(issuer)
    expect(savedIssuer1).toBeDefined()

    const savedIssuer2 = await repository.create(issuer)
    expect(savedIssuer2).toBeDefined()

    const fromDb = await repository.findAll()

    expect(fromDb.length).toEqual(2)
  })

  it('Should delete issuer from database', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    await repository.delete(savedIssuer.id)

    await expect(repository.findById(savedIssuer.id)).rejects.toThrowError(`No issuer found for id: ${savedIssuer.id}`)
  })

  it('Should update issuer in database', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const newName = 'new_name'
    const updatedIssuer = await repository.update(savedIssuer.id, {
      ...savedIssuer,
      name: newName,
      credentialDefinitions: [credentialDefinition1.id],
      credentialSchemas: [credentialSchema.id],
      logo: savedIssuer.logo?.id,
    })

    expect(updatedIssuer).toBeDefined()
    expect(updatedIssuer.name).toEqual(newName)
    expect(updatedIssuer.type).toEqual(issuer.type)
    expect(updatedIssuer.description).toEqual(issuer.description)
    expect(updatedIssuer.organization).toEqual(issuer.organization)
    expect(updatedIssuer.credentialDefinitions.length).toEqual(1)
    expect(updatedIssuer.logo).not.toBeNull()
    expect(updatedIssuer.logo!.id).toBeDefined()
    expect(updatedIssuer.logo!.mediaType).toEqual(asset.mediaType)
    expect(updatedIssuer.logo!.fileName).toEqual(asset.fileName)
    expect(updatedIssuer.logo!.description).toEqual(asset.description)
    expect(updatedIssuer.logo!.content).toStrictEqual(asset.content)
  })

  it('Should throw error when updating issuer with invalid logo id', async (): Promise<void> => {
    const unknownIconId = 'a197e5b2-e4e5-4788-83b1-ecaa0e99ed3a'
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const updatedIssuer: NewIssuer = {
      ...savedIssuer,
      credentialDefinitions: savedIssuer.credentialDefinitions.map((credentialDefinition) => credentialDefinition.id),
      credentialSchemas: savedIssuer.credentialSchemas.map((credentialSchema) => credentialSchema.id),
      logo: unknownIconId,
    }

    await expect(repository.update(savedIssuer.id, updatedIssuer)).rejects.toThrowError(
      `No asset found for id: ${unknownIconId}`,
    )
  })

  it('Should throw error when updating issuer with no credential definitions', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const updatedIssuer: NewIssuer = {
      ...savedIssuer,
      credentialDefinitions: [],
      credentialSchemas: savedIssuer.credentialSchemas.map((credentialSchema) => credentialSchema.id),
      logo: asset.id,
    }

    await expect(repository.update(savedIssuer.id, updatedIssuer)).rejects.toThrowError(
      `At least one credential definition is required`,
    )
  })

  it('Should throw error when updating issuer with no credential schemas', async (): Promise<void> => {
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const updatedIssuer: NewIssuer = {
      ...savedIssuer,
      credentialDefinitions: savedIssuer.credentialDefinitions.map((credentialDefinition) => credentialDefinition.id),
      credentialSchemas: [],
      logo: asset.id,
    }

    await expect(repository.update(savedIssuer.id, updatedIssuer)).rejects.toThrowError(
      `At least one credential schema is required`,
    )
  })

  it('Should throw error when updating issuer with invalid credential definition id', async (): Promise<void> => {
    const unknownCredentialDefinitionId = '498e1086-a2ac-4189-b951-fe863d0fe9fc'
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const updatedIssuer: NewIssuer = {
      ...savedIssuer,
      credentialDefinitions: [unknownCredentialDefinitionId],
      credentialSchemas: savedIssuer.credentialSchemas.map((credentialSchema) => credentialSchema.id),
      logo: asset.id,
    }

    await expect(repository.update(savedIssuer.id, updatedIssuer)).rejects.toThrowError(
      `No credential definition found for id: ${unknownCredentialDefinitionId}`,
    )
  })

  it('Should throw error when updating issuer with invalid credential schema id', async (): Promise<void> => {
    const unknownCredentialSchemaId = '498e1086-a2ac-4189-b951-fe863d0fe9fc'
    const issuer: NewIssuer = {
      name: 'example_name',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition1.id, credentialDefinition2.id],
      credentialSchemas: [credentialSchema.id],
      description: 'example_description',
      organization: 'example_organization',
      logo: asset.id,
    }

    const savedIssuer = await repository.create(issuer)
    expect(savedIssuer).toBeDefined()

    const updatedIssuer: NewIssuer = {
      ...savedIssuer,
      credentialDefinitions: savedIssuer.credentialDefinitions.map((credentialDefinition) => credentialDefinition.id),
      credentialSchemas: [unknownCredentialSchemaId],
      logo: asset.id,
    }

    await expect(repository.update(savedIssuer.id, updatedIssuer)).rejects.toThrowError(
      `No credential schema found for id: ${unknownCredentialSchemaId}`,
    )
  })
})
