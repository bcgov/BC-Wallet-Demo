import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Container } from 'typedi'
import DatabaseService from '../../../services/DatabaseService'
import CredentialSchemaRepository from '../CredentialSchemaRepository'
import * as schema from '../../schema'
import { CredentialAttributeType, IdentifierType, NewCredentialSchema, Source } from '../../../types'

describe('Database credential schema repository tests', (): void => {
  let client: PGlite
  let credentialSchemaRepository: CredentialSchemaRepository

  beforeEach(async (): Promise<void> => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)

    credentialSchemaRepository = Container.get(CredentialSchemaRepository)
  })

  afterEach(async (): Promise<void> => {
    Container.reset()
    await client.close()
  })

  it('should create and retrieve a credential schema', async (): Promise<void> => {
    const newSchema: NewCredentialSchema = {
      name: 'example_name',
      version: 'example_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.CREATED,
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

    const created = await credentialSchemaRepository.create(newSchema)
    expect(created).toBeDefined()
    expect(created.id).toBeDefined()
    expect(created.name).toBe(newSchema.name)
    expect(created.identifier).toBe(newSchema.identifier)
    expect(created.identifierType).toBe(newSchema.identifierType)
    expect(created.version).toBe(newSchema.version)
    expect(created.attributes).toHaveLength(2)
    expect(created.source).toBe(newSchema.source)

    const retrieved = await credentialSchemaRepository.findById(created.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(created.id)
    expect(retrieved?.name).toBe(newSchema.name)
    expect(retrieved?.attributes).toHaveLength(2)
    expect(retrieved?.attributes[0].name).toBe('example_attribute_name1')
    expect(retrieved?.attributes[0].type).toBe(CredentialAttributeType.STRING)
    expect(retrieved?.attributes[1].name).toBe('example_attribute_name2')
    expect(retrieved?.attributes[1].type).toBe(CredentialAttributeType.STRING)
  })

  it('should update a credential schema', async (): Promise<void> => {
    const newSchema: NewCredentialSchema = {
      name: 'original_name',
      version: 'original_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.CREATED,
      attributes: [
        {
          name: 'original_attribute_name',
          value: 'original_attribute_value',
          type: CredentialAttributeType.STRING,
        },
      ],
    }

    const created = await credentialSchemaRepository.create(newSchema)

    const updatedSchema: NewCredentialSchema = {
      name: 'updated_name',
      version: 'updated_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.IMPORTED,
      attributes: [
        {
          name: 'original_attribute_name',
          value: 'original_attribute_value',
          type: CredentialAttributeType.STRING,
        },
      ],
    }

    const updated = await credentialSchemaRepository.update(created.id, updatedSchema)

    expect(updated).toBeDefined()
    expect(updated.id).toBe(created.id)
    expect(updated.source).toBe(updatedSchema.source)
    expect(updated.name).toBe(updatedSchema.name)
    expect(updated.version).toBe(updatedSchema.version)
    expect(updated.attributes).toHaveLength(updatedSchema.attributes.length)
  })

  it('should delete a credential schema', async (): Promise<void> => {
    const newSchema: NewCredentialSchema = {
      name: 'schema_to_delete',
      version: 'delete_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.CREATED,
      attributes: [
        {
          name: 'delete_test_attribute',
          value: 'delete_test_value',
          type: CredentialAttributeType.STRING,
        },
      ],
    }

    const created = await credentialSchemaRepository.create(newSchema)

    await credentialSchemaRepository.delete(created.id)

    try {
      await credentialSchemaRepository.findById(created.id)
      fail('Should have thrown NotFoundError')
    } catch (error) {
      expect(error.message).toBe(`No credential schema found for id: ${created.id}`)
    }
  })

  it('should retrieve all credential schemas', async (): Promise<void> => {
    const schema1: NewCredentialSchema = {
      name: 'first_schema',
      version: 'first_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.CREATED,
      attributes: [
        {
          name: 'first_attribute',
          value: 'first_value',
          type: CredentialAttributeType.STRING,
        },
      ],
    }

    const schema2: NewCredentialSchema = {
      name: 'second_schema',
      version: 'second_version',
      identifierType: IdentifierType.DID,
      identifier: 'did:sov:XUeUZauFLeBNofY3NhaZCB',
      source: Source.CREATED,
      attributes: [
        {
          name: 'second_attribute',
          value: 'second_value',
          type: CredentialAttributeType.STRING,
        },
      ],
    }

    await credentialSchemaRepository.create(schema1)
    await credentialSchemaRepository.create(schema2)

    const allSchemas = await credentialSchemaRepository.findAll()

    expect(allSchemas.length).toBeGreaterThanOrEqual(2)
    expect(allSchemas.some((s) => s.name === 'first_schema')).toBe(true)
    expect(allSchemas.some((s) => s.name === 'second_schema')).toBe(true)
  })
})
