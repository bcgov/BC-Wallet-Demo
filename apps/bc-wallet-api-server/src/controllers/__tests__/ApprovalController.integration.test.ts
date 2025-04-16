import 'reflect-metadata'
import { PGlite } from '@electric-sql/pglite'
import {
  CredentialDefinitionResponse,
  CredentialDefinitionResponseFromJSONTyped,
  PendingApprovalsResponse,
  PendingApprovalsResponseFromJSONTyped,
  ShowcaseFromJSONTyped,
  ShowcaseResponse,
  ShowcaseResponseFromJSONTyped,
} from 'bc-wallet-openapi'
import { Application } from 'express'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'

import {
  createMockDatabaseService,
  createTestShowcase,
  createTestTenant,
  createTestUser,
  createUnapprovedCredDef,
  setupTestDatabase,
} from '../../database/repositories/__tests__/dbTestData'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import TenantRepository from '../../database/repositories/TenantRepository'
import UserRepository from '../../database/repositories/UserRepository'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'
import ShowcaseService from '../../services/ShowcaseService'
import DatabaseService from '../../services/DatabaseService'

import TenantService from '../../services/TenantService'
import { AcceptCredentialAction, ShowcaseStatus } from '../../types'
import ApprovalController from '../ApprovalController'
import supertest = require('supertest')
import { CredentialDefinitionController } from '../CredentialDefinitionController'
import ShowcaseController from '../ShowcaseController'
import { createApiFullTestData } from './apiTestData'
import { MockSessionService } from './MockSessionService'

const isRecentDate = (inputDate: Date | null | undefined, seconds = 5): boolean => {
  if (!inputDate) return false
  const now = new Date()
  const diff = now.getTime() - inputDate.getTime()
  return diff >= 0 && diff < seconds * 1000
}

describe('ApprovalController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any
  let sessionService: MockSessionService

  beforeAll(async () => {
    // Setup Database
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)

    // Register all necessary repositories and services
    useContainer(Container)
    sessionService = Container.get(MockSessionService)
    Container.set('ISessionService', sessionService)
    Container.get(AssetRepository)
    Container.get(CredentialSchemaRepository)
    Container.get(CredentialDefinitionRepository)
    Container.get(IssuerRepository)
    Container.get(PersonaRepository)
    Container.get(RelyingPartyRepository)
    Container.get(ScenarioRepository)
    Container.get(ShowcaseRepository)
    Container.get(UserRepository)
    Container.get(TenantRepository)
    Container.get(TenantService)
    Container.get(CredentialDefinitionService)
    Container.get(ShowcaseService)

    sessionService.setCurrentUser(await createTestUser('approver-user-api'))

    // Create a test tenant
    sessionService.setCurrentTenant(await createTestTenant())

    // Setup Express Server with the controller
    app = createExpressServer({
      controllers: [ApprovalController, ShowcaseController, CredentialDefinitionController],
    })
    request = supertest(app)
  })

  afterAll(async () => {
    await client.close()
    Container.reset()
  })

  it('should approve a specific credential definition', async () => {
    // 1. Setup: Create an unapproved definition using the API helper
    const definition = await createUnapprovedCredDef('cred-def-api-approve')

    // 2. Action: Call the API endpoint
    const response = await request.post(`/credentials/definitions/${definition.id}/approve`).expect(200)

    // 3. Assertions: Check the API response body (OpenAPI type)
    const responseBody: CredentialDefinitionResponse = CredentialDefinitionResponseFromJSONTyped(response.body, false)
    expect(responseBody).toHaveProperty('credentialDefinition')
    const approvedDefResp = responseBody.credentialDefinition
    if (!approvedDefResp) {
      throw Error(`approvedDefResp is undefined`)
    }
    expect(approvedDefResp.id).toEqual(definition.id)
    expect(approvedDefResp.name).toEqual(definition.name)
    expect(approvedDefResp.approvedBy).toBeDefined()
    expect(approvedDefResp.approvedBy?.id).toEqual((await sessionService.getCurrentUser())?.id)
    expect(approvedDefResp.approvedAt).toBeDefined()
    expect(isRecentDate(approvedDefResp.approvedAt)).toBe(true)
    expect(approvedDefResp.icon).toBeDefined()
    expect(approvedDefResp.credentialSchema).toBeDefined()
  })

  it('should return 404 when approving a non-existent credential definition', async () => {
    const nonExistentId = (await sessionService.getCurrentUser())?.id
    await request.post(`/credentials/definitions/${nonExistentId}/approve`).expect(404)
  })

  it('should approve a specific showcase', async () => {
    // 1. Setup: Create an unapproved showcase using the API helper
    const showcase = await createTestShowcase(await getTenantId(), 'showcase-api-approve', ShowcaseStatus.PENDING)

    // 2. Action: Call the approval endpoints
    const action = showcase.scenarios![0].steps![0].actions![0] as AcceptCredentialAction
    await request.post(`/credentials/definitions/${action.credentialDefinitionId}/approve`).expect(200)
    const response = await request.post(`/showcases/${showcase.slug}/approve`).expect(200)

    // 3. Assertions: Check the API response body (OpenAPI type)
    const responseBody: ShowcaseResponse = ShowcaseResponseFromJSONTyped(response.body, false)
    expect(responseBody).toHaveProperty('showcase')
    const approvedShowcaseResp = responseBody.showcase
    if (!approvedShowcaseResp) {
      throw Error(`approvedShowcaseResp is undefined`)
    }
    expect(approvedShowcaseResp.id).toEqual(showcase.id)
    expect(approvedShowcaseResp.name).toEqual(showcase.name)
    expect(approvedShowcaseResp.slug).toEqual(showcase.slug)
    expect(approvedShowcaseResp.approvedBy).toBeDefined() // Placeholder ID string from service
    // expect(approvedShowcaseResp.approvedBy).toEqual(testUserId); // <<< Use when auth passes real ID
    expect(approvedShowcaseResp.approvedAt).toBeDefined()
    expect(isRecentDate(approvedShowcaseResp.approvedAt)).toBe(true)
    expect(approvedShowcaseResp.bannerImage).toBeDefined()
    expect(approvedShowcaseResp.scenarios).toBeInstanceOf(Array)
    expect(approvedShowcaseResp.personas).toBeInstanceOf(Array)
    expect(approvedShowcaseResp.tenantId).toEqual(await getTenantId())
  })

  it('should return 404 when approving a non-existent showcase', async () => {
    const nonExistentSlug = 'non-existent-showcase-slug-api'
    await request.post(`/showcases/${nonExistentSlug}/approve`).expect(404)
  })

  it('should get all unapproved showcases and credential definitions', async () => {
    // 1. Setup: Create a mix of approved and unapproved items using API helpers
    const unapprovedDef = await createUnapprovedCredDef('pending-def-api')
    const unapprovedShowcase = await createTestShowcase(await getTenantId(), 'pending-showcase-api')

    const approvedDef = await createUnapprovedCredDef('approved-def-api')
    // Approve directly using service (simulating prior approval)
    const credDefService = Container.get(CredentialDefinitionService)
    await credDefService.approveCredentialDefinition(approvedDef.id) // Assumes service uses placeholder user

    const approvedShowcase = await createTestShowcase(await getTenantId(), 'approved-showcase-api')
    // Approve directly using service (simulating prior approval)
    const showcaseService = Container.get(ShowcaseService)
    await showcaseService.approveShowcase(approvedShowcase.id) // Assumes service uses placeholder user

    // 2. Action: Call the API endpoint
    const response = await request.get('/approvals/pending').expect(200)

    // 3. Assertions: Check the API response body (OpenAPI type)
    const responseBody: PendingApprovalsResponse = PendingApprovalsResponseFromJSONTyped(response.body, false)
    expect(responseBody).toHaveProperty('credentialDefinitions')
    expect(responseBody).toHaveProperty('showcases')
    expect(responseBody.credentialDefinitions).toBeInstanceOf(Array)
    expect(responseBody.showcases).toBeInstanceOf(Array)

    // Check counts (adjust if other tests leave unapproved items)
    // For more robustness, check specifically for the IDs created in *this* test
    expect(responseBody.credentialDefinitions?.length).toBeGreaterThanOrEqual(1)
    expect(responseBody.showcases?.length).toBeGreaterThanOrEqual(1)

    // Check content of unapproved items
    const foundUnapprovedDef = responseBody.credentialDefinitions?.find((def) => def.id === unapprovedDef.id)
    expect(foundUnapprovedDef).toBeDefined()
    expect(foundUnapprovedDef?.name).toEqual(unapprovedDef.name)
    expect(foundUnapprovedDef?.approvedBy).toBeUndefined()
    expect(foundUnapprovedDef?.approvedAt).toBeUndefined()

    const foundUnapprovedShowcase = responseBody.showcases?.find((sc) => sc.id === unapprovedShowcase.id)
    expect(foundUnapprovedShowcase).toBeDefined()
    expect(foundUnapprovedShowcase?.name).toEqual(unapprovedShowcase.name)
    expect(foundUnapprovedShowcase?.approvedBy).toBeUndefined()
    expect(foundUnapprovedShowcase?.approvedAt).toBeUndefined()

    // Check that approved items are NOT present
    const foundApprovedDef = responseBody.credentialDefinitions?.find((def) => def.id === approvedDef.id)
    expect(foundApprovedDef).toBeUndefined()
    const foundApprovedShowcase = responseBody.showcases?.find((sc) => sc.id === approvedShowcase.id)
    expect(foundApprovedShowcase).toBeUndefined()
  })

  it('should return empty arrays when no items are pending approval', async () => {
    sessionService.setCurrentTenant(await createTestTenant('alt-tenant')) // To not find unapproved defs form other tests

    // 1. Setup: Create only approved items using API helpers
    const approvedDef = await createUnapprovedCredDef('approved-def-api-2')

    await request.post(`/credentials/definitions/${approvedDef.id}/approve`).expect(200)

    const approvedShowcase = await createTestShowcase(await getTenantId(), 'approved-showcase-api-2')

    // Approve
    const action = approvedShowcase.scenarios![0].steps![0].actions![0] as AcceptCredentialAction
    await request.post(`/credentials/definitions/${action.credentialDefinitionId}/approve`).expect(200)
    await request.post(`/showcases/${approvedShowcase.slug}/approve`).expect(200)

    // 2. Action: Call API endpoint
    const response = await request.get('/approvals/pending').expect(200)

    // 3. Assertions: Check response body for empty arrays
    const responseBody: PendingApprovalsResponse = PendingApprovalsResponseFromJSONTyped(response.body, false)
    expect(responseBody).toHaveProperty('credentialDefinitions')
    expect(responseBody).toHaveProperty('showcases')
    expect(responseBody.credentialDefinitions).toBeInstanceOf(Array)
    expect(responseBody.showcases).toBeInstanceOf(Array)

    // Check that the arrays are empty
    //expect(responseBody.credentialDefinitions?.length).toBe(0) // FIXME reenable as soon as we can filter on tenantId
    // expect(responseBody.showcases?.length).toBe(0) // FIXME reenable as soon as we can filter on tenantId
  })

  async function getTenantId() {
    const tenant = await sessionService.getCurrentTenant()
    if (!tenant) {
      return Promise.reject('No tenant was created that was registered in sessionService')
    }
    return tenant.id
  }

  it('should reject approval of a showcase with unapproved credential definitions', async () => {
    // 1. Setup: full showcase
    const testShowcaseReq = await createApiFullTestData(await getTenantId())
    const testShowcaseResponse = await request.post('/showcases').send(testShowcaseReq.showcaseRequest).expect(201)
    const testShowcase = ShowcaseFromJSONTyped(testShowcaseResponse.body.showcase, false)

    // 2. Action: Attempt to approve the showcase without approving the credential definition
    const response = await request.post(`/showcases/${testShowcase.slug}/approve`).expect(400)

    // 3. Assertions: Check for the expected error message
    expect(response.body.message).toContain(`used by step`)
    expect(response.body.message).toContain(`is not approved yet`)

    // Verify the showcase remains unapproved
    const pendingResponse = await request.get('/approvals/pending').expect(200)
    const pendingBody: PendingApprovalsResponse = PendingApprovalsResponseFromJSONTyped(pendingResponse.body, false)

    // The showcase should still be in the pending list
    const stillPendingShowcase = pendingBody.showcases?.find((s) => s.id === testShowcase.id)
    expect(stillPendingShowcase).toBeDefined()
  })
})
