import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import IssuanceScenarioController from '../IssuanceScenarioController'
import { Application } from 'express'
import { AriesOOBActionRequest, IssuanceScenarioRequest, StepRequest, StepType } from 'bc-wallet-openapi'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ScenarioService from '../../services/ScenarioService'
import supertest = require('supertest')
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'
import { CredentialAttributeType, CredentialType, IdentifierType, IssuerType, NewPersona, ScenarioType, StepActionType } from '../../types'

describe('IssuanceScenarioController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    client = new PGlite()
    const database = drizzle(client, { schema }) as unknown as NodePgDatabase
    await migrate(database, { migrationsFolder: './apps/bc-wallet-api-server/src/database/migrations' })
    const mockDatabaseService = {
      getConnection: jest.fn().mockResolvedValue(database),
    }
    Container.set(DatabaseService, mockDatabaseService)
    useContainer(Container)
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(ScenarioRepository)
    Container.get(ScenarioService)
    app = createExpressServer({
      controllers: [IssuanceScenarioController],
      authorizationChecker: () => true
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete an issuance scenario with steps and actions', async () => {
    // Create prerequisites: asset, credential schema, credential definition, and issuer
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const credentialSchemaRepository = Container.get(CredentialSchemaRepository)
    const credentialSchema = await credentialSchemaRepository.create({
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

    const credentialDefinitionRepository = Container.get(CredentialDefinitionRepository)
    const credentialDefinition = await credentialDefinitionRepository.create({
      name: 'Test Definition',
      version: '1.0',
      identifierType: IdentifierType.DID,
      identifier: 'did:test:123',
      icon: asset.id,
      type: CredentialType.ANONCRED,
      credentialSchema: credentialSchema.id,
    })

    const issuerRepository = Container.get(IssuerRepository)
    const issuer = await issuerRepository.create({
      name: 'Test Issuer',
      type: IssuerType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      credentialSchemas: [credentialSchema.id],
      description: 'Test issuer description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // 1. Create a persona for the scenario
    const personaRepository = Container.get(PersonaRepository)
    const newPersona: NewPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    const persona = await personaRepository.create(newPersona)

    // 2. Create an issuance scenario - must include at least one step according to the error
    const scenarioRequest: IssuanceScenarioRequest = {
      name: 'Test Issuance Scenario',
      description: 'Test scenario description',
      steps: [
        {
          title: 'Initial Step',
          description: 'First step description',
          order: 1,
          type: StepType.HumanTask,
          asset: asset.id,
          actions: [
            {
              title: 'Initial Action',
              actionType: StepActionType.ARIES_OOB,
              text: 'Initial action text',
              proofRequest: {
                attributes: {
                  attribute1: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      issuer: issuer.id,
    }

    const createResponse = await request.post('/scenarios/issuances').send(scenarioRequest).expect(201)

    const createdScenario = createResponse.body.issuanceScenario
    expect(createdScenario).toHaveProperty('id')
    expect(createdScenario.name).toEqual('Test Issuance Scenario')
    expect(createdScenario.type).toEqual(ScenarioType.ISSUANCE)
    expect(createdScenario.issuer.id).toEqual(issuer.id)
    expect(createdScenario.steps.length).toEqual(1)

    // 3. Retrieve all issuance scenarios
    const getAllResponse = await request.get('/scenarios/issuances').expect(200)
    expect(getAllResponse.body.issuanceScenarios).toBeInstanceOf(Array)
    expect(getAllResponse.body.issuanceScenarios.length).toBe(1)

    // 4. Retrieve the created scenario
    const getResponse = await request.get(`/scenarios/issuances/${createdScenario.slug}`).expect(200)
    expect(getResponse.body.issuanceScenario.name).toEqual('Test Issuance Scenario')

    // 5. Update the scenario
    const updateResponse = await request
      .put(`/scenarios/issuances/${createdScenario.slug}`)
      .send({
        ...scenarioRequest,
        name: 'Updated Scenario Name',
      })
      .expect(200)

    expect(updateResponse.body.issuanceScenario.name).toEqual('Updated Scenario Name')
    const updatedScenario = updateResponse.body.issuanceScenario

    // 6. Create an additional step for the scenario
    const stepRequest: StepRequest = {
      title: 'Additional Step',
      description: 'Additional step description',
      order: 2,
      type: StepType.HumanTask,
      asset: asset.id,
      actions: [
        {
          title: 'Additional Step Action',
          actionType: StepActionType.ARIES_OOB,
          text: 'Additional step action text',
          proofRequest: {
            attributes: {
              attribute1: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
      ],
    }

    const createStepResponse = await request.post(`/scenarios/issuances/${updatedScenario.slug}/steps`).send(stepRequest).expect(201)

    const createdStep = createStepResponse.body.step
    expect(createdStep).toHaveProperty('id')
    expect(createdStep.title).toEqual('Additional Step')

    // 7. Retrieve all steps for the scenario
    const getAllStepsResponse = await request.get(`/scenarios/issuances/${updatedScenario.slug}/steps`).expect(200)
    expect(getAllStepsResponse.body.steps).toBeInstanceOf(Array)
    expect(getAllStepsResponse.body.steps.length).toBe(2) // Now should have 2 steps

    // 8. Retrieve the created step
    const getStepResponse = await request.get(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}`).expect(200)
    expect(getStepResponse.body.step.title).toEqual('Additional Step')

    // 9. Update the step
    const updateStepResponse = await request
      .put(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}`)
      .send({
        ...stepRequest,
        title: 'Updated Step Title',
      })
      .expect(200)

    expect(updateStepResponse.body.step.title).toEqual('Updated Step Title')

    // 10. Create an additional action for the step
    const actionRequest: AriesOOBActionRequest = {
      title: 'Additional Action',
      actionType: StepActionType.ARIES_OOB,
      text: 'Additional action text',
      proofRequest: {
        attributes: {
          attribute1: {
            attributes: ['attribute1', 'attribute2'],
            restrictions: ['restriction1', 'restriction2'],
          },
          attribute2: {
            attributes: ['attribute1', 'attribute2'],
            restrictions: ['restriction1', 'restriction2'],
          },
        },
        predicates: {
          predicate1: {
            name: 'example_name',
            type: 'example_type',
            value: 'example_value',
            restrictions: ['restriction1', 'restriction2'],
          },
          predicate2: {
            name: 'example_name',
            type: 'example_type',
            value: 'example_value',
            restrictions: ['restriction1', 'restriction2'],
          },
        },
      },
    }

    const createActionResponse = await request
      .post(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions`)
      .send(actionRequest)
      .expect(201)

    const createdAction = createActionResponse.body.action
    expect(createdAction).toHaveProperty('id')
    expect(createdAction.title).toEqual('Additional Action')
    expect(createdAction.actionType).toEqual(StepActionType.ARIES_OOB)

    // 11. Retrieve all actions for the step
    const getAllActionsResponse = await request.get(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions`).expect(200)

    expect(getAllActionsResponse.body.actions).toBeInstanceOf(Array)
    expect(getAllActionsResponse.body.actions.length).toBe(2) // Original action from step creation plus the new one

    // 12. Retrieve the created action
    const getActionResponse = await request
      .get(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .expect(200)

    expect(getActionResponse.body.action.title).toEqual('Additional Action')

    // 13. Update the action
    const updateActionResponse = await request
      .put(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .send({
        ...actionRequest,
        title: 'Updated Action Title',
      })
      .expect(200)

    expect(updateActionResponse.body.action.title).toEqual('Updated Action Title')

    // 14. Delete the action
    await request.delete(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`).expect(204)

    // 15. Delete the step
    await request.delete(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}`).expect(204)

    // 16. Delete the scenario
    await request.delete(`/scenarios/issuances/${updatedScenario.slug}`).expect(204)

    // 17. Verify scenario deletion
    await request.get(`/scenarios/issuances/${updatedScenario.slug}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentSlug = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent scenario
    await request.get(`/scenarios/issuances/${nonExistentSlug}`).expect(404)

    // Try to get steps for a non-existent scenario
    await request.get(`/scenarios/issuances/${nonExistentSlug}/steps`).expect(404)

    // Try to create a step for a non-existent scenario
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const stepRequest: StepRequest = {
      title: 'Test Step',
      description: 'Test step description',
      order: 1,
      type: StepType.HumanTask,
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
              attribute2: {
                attributes: ['attribute1', 'attribute2'],
                restrictions: ['restriction1', 'restriction2'],
              },
            },
            predicates: {
              predicate1: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
              predicate2: {
                name: 'example_name',
                type: 'example_type',
                value: 'example_value',
                restrictions: ['restriction1', 'restriction2'],
              },
            },
          },
        },
      ],
    }

    await request.post(`/scenarios/issuances/${nonExistentSlug}/steps`).send(stepRequest).expect(404)
  })

  it('should validate request data when creating an issuance scenario', async () => {
    // Attempt to create a scenario with missing required fields
    const invalidScenarioRequest = {
      // Missing name, description, etc.
    }

    await request.post('/scenarios/issuances').send(invalidScenarioRequest).expect(400)

    // Set up assets and personas for testing
    const assetRepository = Container.get(AssetRepository)
    const asset = await assetRepository.create({
      mediaType: 'image/png',
      fileName: 'test.png',
      description: 'Test image',
      content: Buffer.from('binary data'),
    })

    const personaRepository = Container.get(PersonaRepository)
    const newPersona: NewPersona = {
      name: 'Test Person',
      role: 'Tester',
      description: 'Test persona',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    const persona = await personaRepository.create(newPersona)

    // Attempt to create a scenario with a non-existent issuer
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidScenarioRequest2: IssuanceScenarioRequest = {
      name: 'Invalid Scenario',
      description: 'Test description',
      steps: [
        {
          title: 'Test Step',
          description: 'Test step description',
          order: 1,
          type: StepType.HumanTask,
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
                  attribute2: {
                    attributes: ['attribute1', 'attribute2'],
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
                predicates: {
                  predicate1: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                  predicate2: {
                    name: 'example_name',
                    type: 'example_type',
                    value: 'example_value',
                    restrictions: ['restriction1', 'restriction2'],
                  },
                },
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      issuer: nonExistentId,
    }

    await request.post('/scenarios/issuances').send(invalidScenarioRequest2).expect(404)
  })
})
