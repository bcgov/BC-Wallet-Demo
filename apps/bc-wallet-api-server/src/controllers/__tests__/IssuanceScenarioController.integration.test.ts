import './setup-env'
import './setup-mocks'
import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import { AriesOOBActionRequest } from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createMockDatabaseService,
  createTestAsset,
  createTestCredentialDefinition,
  createTestCredentialSchema,
  createTestIssuer,
  createTestPersona,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import DatabaseService from '../../services/DatabaseService'
import ScenarioService from '../../services/ScenarioService'
import { ScenarioType, StepActionType } from '../../types'
import IssuanceScenarioController from '../IssuanceScenarioController'
import { createApiIssuanceScenarioRequest, createApiStepRequest } from './apiTestData'
import { setupTestDatabase } from './globalTestSetup'
import supertest = require('supertest')

describe('IssuanceScenarioController Integration Tests', () => {
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
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(ScenarioRepository)
    Container.get(ScenarioService)
    app = createExpressServer({
      controllers: [IssuanceScenarioController],
      authorizationChecker: () => true,
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should create, retrieve, update, and delete an issuance scenario with steps and actions', async () => {
    // Create prerequisites
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)
    const issuer = await createTestIssuer(asset, credentialDefinition, credentialSchema)
    const persona = await createTestPersona(asset)

    // 2. Create an issuance scenario - must include at least one step according to the error
    const scenarioRequest = createApiIssuanceScenarioRequest(issuer.id, persona.id, asset.id, credentialDefinition.id)

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
    const stepRequest = createApiStepRequest(asset.id, credentialDefinition.id)
    stepRequest.title = 'Additional Step'
    stepRequest.description = 'Additional step description'
    stepRequest.order = 2

    const createStepResponse = await request
      .post(`/scenarios/issuances/${updatedScenario.slug}/steps`)
      .send(stepRequest)
      .expect(201)

    const createdStep = createStepResponse.body.step
    expect(createdStep).toHaveProperty('id')
    expect(createdStep.title).toEqual('Additional Step')

    // 7. Retrieve all steps for the scenario
    const getAllStepsResponse = await request.get(`/scenarios/issuances/${updatedScenario.slug}/steps`).expect(200)
    expect(getAllStepsResponse.body.steps).toBeInstanceOf(Array)
    expect(getAllStepsResponse.body.steps.length).toBe(2) // Now should have 2 steps

    // 8. Retrieve the created step
    const getStepResponse = await request
      .get(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}`)
      .expect(200)
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
      credentialDefinitionId: credentialDefinition.id,
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
            type: '>=',
            value: 1,
            restrictions: ['restriction1', 'restriction2'],
          },
          predicate2: {
            name: 'example_name',
            type: '>=',
            value: 1,
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
    const getAllActionsResponse = await request
      .get(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions`)
      .expect(200)

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
    await request
      .delete(`/scenarios/issuances/${updatedScenario.slug}/steps/${createdStep.id}/actions/${createdAction.id}`)
      .expect(204)

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
    const asset = await createTestAsset()
    const credentialSchema = await createTestCredentialSchema()
    const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)

    const stepRequest = createApiStepRequest(asset.id, credentialDefinition.id)

    await request.post(`/scenarios/issuances/${nonExistentSlug}/steps`).send(stepRequest).expect(404)
  })

  it('should validate request data when creating an issuance scenario', async () => {
    // Attempt to create a scenario with missing required fields
    const invalidScenarioRequest = {
      // Missing name, description, etc.
    }

    await request.post('/scenarios/issuances').send(invalidScenarioRequest).expect(400)

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
})
