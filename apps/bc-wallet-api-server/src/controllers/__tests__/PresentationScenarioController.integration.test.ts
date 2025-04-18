import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { StepAction } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createMockDatabaseService,
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestPersona,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import DatabaseService from '../../services/DatabaseService'
import ScenarioService from '../../services/ScenarioService'
import { RelyingPartyType, ScenarioType, StepActionType } from '../../types'
import PresentationScenarioController from '../PresentationScenarioController'
import {
  createApiAcceptAction,
  createApiButtonAction,
  createApiIssuanceScenarioRequest,
  createApiPresentationScenarioRequest,
  createApiSetupConnectionAction,
  createApiStepRequest,
} from './apiTestData'
import { setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')

describe('PresentationScenarioController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any

  beforeAll(async () => {
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
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
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete a presentation scenario with steps and actions', async () => {
    // Create prerequisites using test utilities
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    // Create relying party
    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const relyingParty = await relyingPartyRepository.create({
      name: 'Test Relying Party',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'Test relying party description',
      organization: 'Test Organization',
      logo: asset.id,
    })

    // Create persona
    const persona = await createTestPersona(asset)

    const scenarioRequest = createApiPresentationScenarioRequest(
      relyingParty.id,
      persona.id,
      asset.id,
      credentialDefinition.id,
    )

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
    const stepRequest = createApiStepRequest(asset.id, credentialDefinition.id, 2)
    const createStepResponse = await request
      .post(`/scenarios/presentations/${updatedScenario.slug}/steps`)
      .send(stepRequest)
      .expect(201)

    const createdStep = createStepResponse.body.step
    expect(createdStep).toHaveProperty('id')
    expect(createdStep.title).toEqual('Test Step')

    // 7. Retrieve all steps for the scenario
    const getAllStepsResponse = await request.get(`/scenarios/presentations/${updatedScenario.slug}/steps`).expect(200)
    expect(getAllStepsResponse.body.steps).toBeInstanceOf(Array)
    expect(getAllStepsResponse.body.steps.length).toBe(2)

    // 8. Retrieve the created step
    const getStepResponse = await request
      .get(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}`)
      .expect(200)
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
    const actionRequest = createApiAcceptAction(credentialDefinition.id)
    actionRequest.title = 'Additional Action'
    actionRequest.text = 'Additional action text'

    const createActionResponse = await request
      .post(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions`)
      .send(actionRequest)
      .expect(201)

    const createdAction = createActionResponse.body.action
    expect(createdAction).toHaveProperty('id')
    expect(createdAction.title).toEqual('Additional Action')
    expect(createdAction.actionType).toEqual(StepActionType.ACCEPT_CREDENTIAL)

    // 11. Retrieve all actions for the step
    const getAllActionsResponse = await request
      .get(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions`)
      .expect(200)

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
    await request
      .delete(`/scenarios/presentations/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .expect(204)

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
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    const stepRequest = createApiStepRequest(asset.id, credentialDefinition.id)
    await request.post(`/scenarios/presentations/${nonExistentSlug}/steps`).send(stepRequest).expect(404)
  })

  it('should validate request data when creating an issuance scenario', async () => {
    // Attempt to create a scenario with missing required fields
    const invalidScenarioRequest = {
      // Missing name, description, etc.
    }

    await request.post('/scenarios/presentations').send(invalidScenarioRequest).expect(400)

    // Set up assets and personas for testing
    const asset = await createTestAsset()
    const persona = await createTestPersona(asset)
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    // Attempt to create a scenario with a non-existent issuer
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    const invalidScenarioRequest2 = createApiIssuanceScenarioRequest(
      nonExistentId,
      persona.id,
      asset.id,
      credentialDefinition.id,
    )

    await request.post('/scenarios/issuances').send(invalidScenarioRequest2).expect(404)
  })

  it('should create, update, and verify different step action types', async () => {
    // Set up assets and dependencies
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    const relyingPartyRepository = Container.get(RelyingPartyRepository)
    const relyingParty = await relyingPartyRepository.create({
      name: 'Action Types Test RP',
      type: RelyingPartyType.ARIES,
      credentialDefinitions: [credentialDefinition.id],
      description: 'Test RP for action types',
      organization: 'Test Organization',
      logo: asset.id,
    })

    const persona = await createTestPersona(asset)

    // Create a scenario with initial step
    const scenarioRequest = createApiPresentationScenarioRequest(
      relyingParty.id,
      persona.id,
      asset.id,
      credentialDefinition.id,
    )
    scenarioRequest.name = 'Action Types Test Scenario'
    scenarioRequest.description = 'Testing different action types'

    const createResponse = await request.post('/scenarios/presentations').send(scenarioRequest).expect(201)
    const createdScenario = createResponse.body.presentationScenario
    expect(createdScenario).toHaveProperty('id')

    // Test ButtonAction
    const buttonActionRequest = createApiButtonAction()

    const buttonActionResponse = await request
      .post(`/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions`)
      .send(buttonActionRequest)
      .expect(201)

    const buttonAction = buttonActionResponse.body.action
    expect(buttonAction).toHaveProperty('id')
    expect(buttonAction.actionType).toEqual(StepActionType.BUTTON)
    expect(buttonAction.goToStep).toEqual('step2')

    // Test SetupConnectionAction
    const setupConnectionActionRequest = createApiSetupConnectionAction()

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
    expect(actionTypes).toContain(StepActionType.ACCEPT_CREDENTIAL)
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
      .put(
        `/scenarios/presentations/${createdScenario.slug}/steps/${createdScenario.steps[0].id}/actions/${buttonAction.id}`,
      )
      .send(updateButtonRequest)
      .expect(200)

    const updatedButtonAction = updateResponse.body.action
    expect(updatedButtonAction.text).toEqual('Updated button text')
    expect(updatedButtonAction.goToStep).toEqual('newStep')

    // Clean up by deleting the scenario
    await request.delete(`/scenarios/presentations/${createdScenario.slug}`).expect(204)
  })
})
