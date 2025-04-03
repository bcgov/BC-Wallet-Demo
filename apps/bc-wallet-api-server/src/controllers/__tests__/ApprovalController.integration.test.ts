import 'reflect-metadata'
import { createExpressServer, useContainer } from 'routing-controllers'
import { Container } from 'typedi'
import { Application } from 'express'
import { PGlite } from '@electric-sql/pglite'

import ApprovalController from '../ApprovalController'
import AssetRepository from '../../database/repositories/AssetRepository'
import CredentialSchemaRepository from '../../database/repositories/CredentialSchemaRepository'
import CredentialDefinitionRepository from '../../database/repositories/CredentialDefinitionRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import RelyingPartyRepository from '../../database/repositories/RelyingPartyRepository'
import ScenarioRepository from '../../database/repositories/ScenarioRepository'
import ShowcaseRepository from '../../database/repositories/ShowcaseRepository'
import UserRepository from '../../database/repositories/UserRepository'
import CredentialDefinitionService from '../../services/CredentialDefinitionService'
import ShowcaseService from '../../services/ShowcaseService'
import DatabaseService from '../../services/DatabaseService'
import {
  createMockDatabaseService,
  createTestShowcase,
  createTestTenant,
  createTestUser,
  createUnapprovedCredDef,
  setupTestDatabase,
} from './dbTestData'
import { CredentialDefinitionResponse, PendingApprovalsResponse, ShowcaseResponse } from 'bc-wallet-openapi'
import TenantRepository from '../../database/repositories/TenantRepository'
import TenantService from '../../services/TenantService'
import { ShowcaseStatus } from '../../types'
import supertest = require('supertest')

const isRecentDate = (dateString: string | null | undefined, seconds = 5): boolean => {
  if (!dateString) return false
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  return diff >= 0 && diff < seconds * 1000
}

describe('ApprovalController Integration Tests', () => {
  let client: PGlite
  let app: Application
  let request: any
  let testTenantId = 'approval-test-tenant' // Define tenant ID for tests

  beforeAll(async () => {
    // Setup Database
    const { client: pgClient, database } = await setupTestDatabase()
    client = pgClient
    const mockDatabaseService = await createMockDatabaseService(database)
    Container.set(DatabaseService, mockDatabaseService)

    // Register all necessary repositories and services
    useContainer(Container)
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

    await createTestUser('approver-user-api')

    // Create a test tenant
    await createTestTenant(testTenantId)

    // Setup Express Server with the controller
    app = createExpressServer({
      controllers: [ApprovalController],
      // Add other necessary configurations like defaultErrorHandler if used elsewhere
      // defaultErrorHandler: false // Example if you have custom error handling
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
    const responseBody: CredentialDefinitionResponse = response.body
    expect(responseBody).toHaveProperty('credentialDefinition')
    const approvedDefResp = responseBody.credentialDefinition
    if (!approvedDefResp) {
      throw Error(`approvedDefResp is undefined`)
    }
    expect(approvedDefResp.id).toEqual(definition.id)
    expect(approvedDefResp.name).toEqual(definition.name)
    expect(approvedDefResp.approvedBy).toBeDefined() // Should be the placeholder ID string from service
    // expect(approvedDefResp.approvedBy).toEqual(testUserId); // <<< Use when auth passes real ID
    expect(approvedDefResp.approvedAt).toBeDefined()
    expect(isRecentDate(approvedDefResp.approvedAt?.toISOString())).toBe(true)
    expect(approvedDefResp.icon).toBeDefined() // Check other fields returned
    expect(approvedDefResp.credentialSchema).toBeDefined()
  })

  it('should return 404 when approving a non-existent credential definition', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000'
    await request.post(`/credentials/definitions/${nonExistentId}/approve`).expect(404)
  })

  it('should approve a specific showcase', async () => {
    // 1. Setup: Create an unapproved showcase using the API helper
    const showcase = await createTestShowcase(testTenantId, 'showcase-api-approve', ShowcaseStatus.PENDING)

    // 2. Action: Call the API endpoint
    const response = await request.post(`/showcases/${showcase.slug}/approve`).expect(200)

    // 3. Assertions: Check the API response body (OpenAPI type)
    const responseBody: ShowcaseResponse = response.body
    expect(responseBody).toHaveProperty('showcase')
    const approvedShowcaseResp = responseBody.showcase
    if(!approvedShowcaseResp) {
      throw Error(`approvedShowcaseResp is undefined`)
    }
    expect(approvedShowcaseResp.id).toEqual(showcase.id)
    expect(approvedShowcaseResp.name).toEqual(showcase.name)
    expect(approvedShowcaseResp.slug).toEqual(showcase.slug)
    expect(approvedShowcaseResp.approvedBy).toBeDefined() // Placeholder ID string from service
    // expect(approvedShowcaseResp.approvedBy).toEqual(testUserId); // <<< Use when auth passes real ID
    expect(approvedShowcaseResp.approvedAt).toBeDefined()
    expect(isRecentDate(approvedShowcaseResp.approvedAt?.toISOString())).toBe(true)
    expect(approvedShowcaseResp.bannerImage).toBeDefined()
    expect(approvedShowcaseResp.scenarios).toBeInstanceOf(Array)
    expect(approvedShowcaseResp.personas).toBeInstanceOf(Array)
    // expect(approvedShowcaseResp.tenantId).toEqual(testTenantId) // Verify tenantId if present in Showcase DTO
  })

  it('should return 404 when approving a non-existent showcase', async () => {
    const nonExistentSlug = 'non-existent-showcase-slug-api'
    await request.post(`/showcases/${nonExistentSlug}/approve`).expect(404)
  })

  it('should get all unapproved showcases and credential definitions', async () => {
    // 1. Setup: Create a mix of approved and unapproved items using API helpers
    const unapprovedDef = await createUnapprovedCredDef('pending-def-api')
    const unapprovedShowcase = await createTestShowcase(testTenantId, 'pending-showcase-api')

    const approvedDef = await createUnapprovedCredDef('approved-def-api')
    // Approve directly using service (simulating prior approval)
    const credDefService = Container.get(CredentialDefinitionService)
    await credDefService.approveCredentialDefinition(approvedDef.id) // Assumes service uses placeholder user

    const approvedShowcase = await createTestShowcase(testTenantId, 'approved-showcase-api')
    // Approve directly using service (simulating prior approval)
    const showcaseService = Container.get(ShowcaseService)
    await showcaseService.approveShowcase(approvedShowcase.id) // Assumes service uses placeholder user

    // 2. Action: Call the API endpoint
    const response = await request.get('/approvals/pending').expect(200)

    // 3. Assertions: Check the API response body (OpenAPI type)
    const responseBody: PendingApprovalsResponse = response.body
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
    // 1. Setup: Create only approved items using API helpers and service approval
    const approvedDef = await createUnapprovedCredDef('approved-def-api-2')
    const credDefService = Container.get(CredentialDefinitionService)
    await credDefService.approveCredentialDefinition(approvedDef.id)

    const approvedShowcase = await createTestShowcase(testTenantId, 'approved-showcase-api-2')
    const showcaseService = Container.get(ShowcaseService)
    await showcaseService.approveShowcase(approvedShowcase.id)

    // 2. Action: Call API endpoint
    const response = await request.get('/approvals/pending').expect(200)

    // 3. Assertions: Check response body for empty arrays
    const responseBody: PendingApprovalsResponse = response.body
    expect(responseBody).toHaveProperty('credentialDefinitions')
    expect(responseBody).toHaveProperty('showcases')
    expect(responseBody.credentialDefinitions).toBeInstanceOf(Array)
    expect(responseBody.showcases).toBeInstanceOf(Array)
    // Check specifically for emptiness, assuming test isolation
    expect(responseBody.credentialDefinitions?.length).toBe(0)
    expect(responseBody.showcases?.length).toBe(0)
  })
})
