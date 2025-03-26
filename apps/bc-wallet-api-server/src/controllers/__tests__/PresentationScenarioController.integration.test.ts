import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import PresentationScenarioController from '../PresentationScenarioController'
import { Application } from 'express'
import {
  AriesOOBActionRequest,
  IssuanceScenarioRequest,
  PresentationScenarioRequest,
  StepAction,
  StepRequest,
  StepType,
} from 'bc-wallet-openapi'
import { PGlite } from '@electric-sql/pglite'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ScenarioService from '../../services/ScenarioService'
import { CredentialAttributeType, CredentialType, IdentifierType, NewPersona, RelyingPartyType, ScenarioType, StepActionType } from '../../types'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from '../../database/schema'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import DatabaseService from '../../services/DatabaseService'
import supertest = require('supertest')

describe('PresentationScenarioController Integration Tests', () => {
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
    Container.get(RelyingPartyRepository)
    Container.get(ScenarioRepository)
    Container.get(ScenarioService)
    app = createExpressServer({
      controllers: [PresentationScenarioController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a presentation scenario with steps and actions', async () => {
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
        { name: 'example_attribute_name1', value: 'example_attribute_value1', type: CredentialAttributeType.STRING },
        { name: 'example_attribute_name2', value: 'example_attribute_value2', type: CredentialAttributeType.STRING },
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

    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const relyingParty = await relyingPartyRepository.create({
      name: 'Test Relying Party',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'Test relying party description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // 1. Create a persona for the scenario
    const personaRepository = Container.get(PersonaRepository)
    const newPersona = {
      name: 'John Doe',
      role: 'Software Engineer',
      description: 'Experienced developer',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    }
    const persona = await personaRepository.create(newPersona)

    // 2. Create an issuance scenario - must include at least one step according to the error
    const scenarioRequest: PresentationScenarioRequest = {
      name: 'Test Presentation Scenario',
      description: 'Test scenario description',
      steps: [
        {
          title: 'Initial Step',
          description: 'Initial step description',
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
      relyingParty: relyingParty.id,
      hidden: false,
    }

    const createResponse = await request.post('/scenarios/presentations').send(scenarioRequest).expect(201)

    const createdScenario = createResponse.body.presentationScenario
    expect(createdScenario).toHaveProperty('id')
    expect(createdScenario.name).toEqual('Test Presentation Scenario')
    expect(createdScenario.type).toEqual(ScenarioType.PRESENTATION)
    expect(createdScenario.relyingParty.id).toEqual(relyingParty.id)

    // 3. Retrieve all presentation scenarios
    const getAllResponse = await request.get('/scenarios/presentations').expect(200)
    expect(getAllResponse.body.presentationScenarios).toBeInstanceOf(Array)
    expect(getAllResponse.body.presentationScenarios.length).toBe(1)

    // 4. Retrieve the created scenario
    const getResponse = await request.get(`/scenarios/presentations/${createdScenario.slug}`).expect(200)
    expect(getResponse.body.presentationScenario.name).toEqual('Test Presentation Scenario')

    // 5. Update the scenario
    const updateResponse = await request
      .put(`/scenarios/presentations/${createdScenario.slug}`)
      .send({
        ...scenarioRequest,
        name: 'Updated Presentation Scenario Name',
      })
      .expect(200)
    expect(updateResponse.body.presentationScenario.name).toEqual('Updated Presentation Scenario Name')
    const updatedScenario = updateResponse.body.presentationScenario

    // 6. Create a step for the scenario
    const stepRequest: StepRequest = {
      title: 'Test Step',
      description: 'Test step description',
      order: 2,
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

    const createStepResponse = await request.post(`/scenarios/presentations/${updatedScenario.slug}/steps`).send(stepRequest).expect(201)

    const createdStep = createStepResponse.body.step
    expect(createdStep).toHaveProperty('id')
    expect(createdStep.title).toEqual('Test Step')

    // 7. Retrieve all steps for the scenario
    const getAllStepsResponse = await request.get(`/scenarios/presentations/${updatedScenario.slug}/steps`).expect(200)
    expect(getAllStepsResponse.body.steps).toBeInstanceOf(Array)
    expect(getAllStepsResponse.body.steps.length).toBe(2)

    // 8. Retrieve the created step
    const getStepResponse = await request.get(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}`).expect(200)
    expect(getStepResponse.body.step.title).toEqual('Test Step')

    // 9. Update the step
    const updateStepResponse = await request
      .put(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}`)
      .send({
        ...stepRequest,
        title: 'Updated Test Step',
      })
      .expect(200)
    expect(updateStepResponse.body.step.title).toEqual('Updated Test Step')

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
      .post(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions`)
      .send(actionRequest)
      .expect(201)

    const createdAction = createActionResponse.body.action
    expect(createdAction).toHaveProperty('id')
    expect(createdAction.title).toEqual('Additional Action')
    expect(createdAction.actionType).toEqual(StepActionType.ARIES_OOB)

    // 11. Retrieve all actions for the step
    const getAllActionsResponse = await request.get(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions`).expect(200)

    expect(getAllActionsResponse.body.actions).toBeInstanceOf(Array)
    expect(getAllActionsResponse.body.actions.length).toBe(2) // Original action from step creation plus the new one

    // 12. Retrieve the created action
    const getActionResponse = await request
      .get(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .expect(200)

    expect(getActionResponse.body.action.title).toEqual('Additional Action')

    // 13. Update the action
    const updateActionResponse = await request
      .put(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .send({
        ...actionRequest,
        title: 'Updated Action Title',
      })
      .expect(200)

    expect(updateActionResponse.body.action.title).toEqual('Updated Action Title')

    // 14. Delete the action
    await request.delete(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`).expect(204)

    // 15. Delete the step
    await request.delete(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}`).expect(204)

    // 16. Delete the scenario
    await request.delete(`/scenarios/presentations/${updatedScenario.slug}`).expect(204)

    // 17. Verify scenario deletion
    await request.get(`/scenarios/presentations/${updatedScenario.slug}`).expect(404)
  })

  it('should handle errors when accessing non-existent resources', async () => {
    const nonExistentSlug = '00000000-0000-0000-0000-000000000000'

    // Try to get a non-existent scenario
    await request.get(`/scenarios/presentations/${nonExistentSlug}`).expect(404)

    // Try to get steps for a non-existent scenario
    await request.get(`/scenarios/presentations/${nonExistentSlug}/steps`).expect(404)

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

    await request.post(`/scenarios/presentations/${nonExistentSlug}/steps`).send(stepRequest).expect(404)
  })

  it('should validate request data when creating an issuance scenario', async () => {
    // Attempt to create a scenario with missing required fields
    const invalidScenarioRequest = {
      // Missing name, description, etc.
    }

    await request.post('/scenarios/presentations').send(invalidScenarioRequest).expect(400)

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

  it('should create, update, and verify different step action types', async () => {
    // Set up assets and dependencies
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
        { name: 'example_attribute_name1', value: 'example_attribute_value1', type: CredentialAttributeType.STRING },
        { name: 'example_attribute_name2', value: 'example_attribute_value2', type: CredentialAttributeType.STRING },
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

    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const relyingParty = await relyingPartyRepository.create({
      name: 'Action Types Test RP',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'Test RP for action types',
      organization: 'Test Organization',
      logo: asset.id,
    })

    const personaRepository = Container.get(PersonaRepository)
    const persona = await personaRepository.create({
      name: 'Action Test Person',
      role: 'Tester',
      description: 'Test persona for actions',
      headshotImage: asset.id,
      bodyImage: asset.id,
      hidden: false,
    })

    // Create a scenario with initial step
    const scenarioRequest = {
      name: 'Action Types Test Scenario',
      description: 'Testing different action types',
      steps: [
        {
          title: 'Initial Step',
          description: 'Initial step for action tests',
          order: 1,
          type: StepType.HumanTask,
          asset: asset.id,
          actions: [
            {
              title: 'Initial Action',
              actionType: StepActionType.ARIES_OOB,
              text: 'Initial action',
              proofRequest: {
                attributes: {},
                predicates: {},
              },
            },
          ],
        },
      ],
      personas: [persona.id],
      relyingParty: relyingParty.id,
      hidden: false,
    }

    const createResponse = await request.post('/scenarios/presentations').send(scenarioRequest).expect(201)
    const createdScenario = createResponse.body.presentationScenario
    expect(createdScenario).toHaveProperty('id')

    // Test ButtonAction
    const buttonActionRequest = {
      title: 'Button Action',
      actionType: StepActionType.BUTTON,
      text: 'Click this button',
      goToStep: 'step2',
    }

    const buttonActionResponse = await request
      .post(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions`)
      .send(buttonActionRequest)
      .expect(201)

    const buttonAction = buttonActionResponse.body.action
    expect(buttonAction).toHaveProperty('id')
    expect(buttonAction.actionType).toEqual(StepActionType.BUTTON)
    expect(buttonAction.goToStep).toEqual('step2')

    // Test SetupConnectionAction
    const setupConnectionActionRequest = {
      title: 'Setup Connection',
      actionType: StepActionType.SETUP_CONNECTION,
      text: 'Set up a connection',
    }

    const setupConnectionResponse = await request
      .post(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions`)
      .send(setupConnectionActionRequest)
      .expect(201)

    const setupConnectionAction = setupConnectionResponse.body.action
    expect(setupConnectionAction).toHaveProperty('id')
    expect(setupConnectionAction.actionType).toEqual(StepActionType.SETUP_CONNECTION)

    // Test ChooseWalletAction
    const chooseWalletActionRequest = {
      title: 'Choose Wallet',
      actionType: StepActionType.CHOOSE_WALLET,
      text: 'Select your wallet',
    }

    const chooseWalletResponse = await request
      .post(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions`)
      .send(chooseWalletActionRequest)
      .expect(201)

    const chooseWalletAction = chooseWalletResponse.body.action
    expect(chooseWalletAction).toHaveProperty('id')
    expect(chooseWalletAction.actionType).toEqual(StepActionType.CHOOSE_WALLET)

    // Verify we can get all actions
    const getAllActionsResponse = await request
      .get(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions`)
      .expect(200)

    const actions = getAllActionsResponse.body.actions
    expect(actions).toBeInstanceOf(Array)
    expect(actions.length).toBe(4) // Original + 3 new ones

    // Check each action type is present
    const actionTypes = actions.map((a: StepAction) => a.actionType)
    expect(actionTypes).toContain(StepActionType.ARIES_OOB)
    expect(actionTypes).toContain(StepActionType.BUTTON)
    expect(actionTypes).toContain(StepActionType.SETUP_CONNECTION)
    expect(actionTypes).toContain(StepActionType.CHOOSE_WALLET)

    // Test updating a specific action - modify the ButtonAction
    const updateButtonRequest = {
      ...buttonActionRequest,
      text: 'Updated button text',
      goToStep: 'newStep',
    }

    const updateResponse = await request
      .put(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions/${buttonAction.id}`)
      .send(updateButtonRequest)
      .expect(200)

    const updatedButtonAction = updateResponse.body.action
    expect(updatedButtonAction.text).toEqual('Updated button text')
    expect(updatedButtonAction.goToStep).toEqual('newStep')

    // Clean up by deleting the scenario
    await request.delete(`/scenarios/presentations/${createdScenario.slug}`).expect(204)
  })
})
