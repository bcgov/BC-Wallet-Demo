import {
  AriesOOBActionRequest,
  ButtonActionRequest,
  ChooseWalletActionRequest,
  IssuanceScenarioRequest, IssuerRequest,
  PresentationScenarioRequest,
  SetupConnectionActionRequest,
  ShowcaseRequest,
  ShowcaseStatus,
  StepActionType,
  StepRequest,
  StepType
} from 'bc-wallet-openapi'
import { createTestAsset, createTestCredentialDefinition, createTestCredentialSchema, createTestIssuer, createTestPersona, createTestScenario } from './dbTestData'
import Container from 'typedi'
import AssetRepository from '../../database/repositories/AssetRepository'
import PersonaRepository from '../../database/repositories/PersonaRepository'
import IssuerRepository from '../../database/repositories/IssuerRepository'

// Proof Request structure
export function createApiProofRequest() {
  return {
    attributes: {
      attribute1: {
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
    },
  }
}

// Step Actions
export function createApiAriesOOBAction(): AriesOOBActionRequest {
  return {
    title: 'Test Action',
    actionType: StepActionType.AriesOob,
    text: 'Test action text',
    proofRequest: createApiProofRequest(),
  }
}

export function createApiButtonAction(): ButtonActionRequest {
  return {
    title: 'Button Action',
    actionType: StepActionType.Button,
    text: 'Click this button',
    goToStep: 'step2',
  }
}

export function createApiSetupConnectionAction(): SetupConnectionActionRequest {
  return {
    title: 'Setup Connection',
    actionType: StepActionType.SetupConnection,
    text: 'Set up a connection',
  }
}

export function createApiChooseWalletAction(): ChooseWalletActionRequest {
  return {
    title: 'Choose Wallet',
    actionType: StepActionType.ChooseWallet,
    text: 'Select your wallet',
  }
}

// Step Request
export function createApiStepRequest(assetId: string, order: number = 1): StepRequest {
  return {
    title: 'Test Step',
    description: 'Test step description',
    order,
    type: StepType.HumanTask,
    asset: assetId,
    actions: [createApiAriesOOBAction()],
  }
}

// Scenario Requests
export function createApiPresentationScenarioRequest(
  relyingPartyId: string,
  personaId: string,
  assetId: string,
): PresentationScenarioRequest {
  return {
    name: 'Test Presentation Scenario',
    description: 'Test scenario description',
    steps: [createApiStepRequest(assetId)],
    personas: [personaId],
    relyingParty: relyingPartyId,
    hidden: false,
  }
}

export function createApiIssuanceScenarioRequest(
  issuerId: string,
  personaId: string,
  assetId: string,
): IssuanceScenarioRequest {
  return {
    name: 'Test Issuance Scenario',
    description: 'Test scenario description',
    steps: [createApiStepRequest(assetId)],
    personas: [personaId],
    issuer: issuerId,
    hidden: false,
  }
}

// Showcase Request
export function createApiShowcaseRequest(
  scenarioId: string,
  personaId: string,
  assetId: string,
  tenantId: string,
): ShowcaseRequest {
  return {
    name: 'Test Showcase',
    description: 'Test showcase description',
    status: ShowcaseStatus.Active,
    hidden: false,
    scenarios: [scenarioId],
    personas: [personaId],
    bannerImage: assetId,
    completionMessage: 'Congratulations on completing the showcase!',
    tenantId: tenantId,
  }
}

export function createApiIssuerRequest(
  assetId: string,
  credentialDefinitions: string[],
  credentialSchemas: string[]
): IssuerRequest {
  return {
    name: 'Test Issuer',
    description: 'Test Issuer Description',
    type: 'ARIES',
    organization: 'Test Organization',
    logo: assetId,
    credentialDefinitions: credentialDefinitions,
    credentialSchemas: credentialSchemas
  }
}

export async function createApiFullTestData(tenantId: string): Promise<{ showcaseRequest: ShowcaseRequest }> {
  const asset = await createTestAsset()
  const persona = await createTestPersona(asset)
  const credentialSchema = await createTestCredentialSchema()
  const credentialDefinition = await createTestCredentialDefinition(asset, credentialSchema)
  const issuer = await createTestIssuer(asset, credentialDefinition, credentialSchema)
  const scenario = await createTestScenario(asset, persona, issuer)
  const showcaseRequest = createApiShowcaseRequest(scenario.id, persona.id, asset.id, tenantId)
  return { showcaseRequest }
}

export async function createApiTestScenario(
  assetId: string,
  personaId: string,
  issuerId: string,
): Promise<{ id: string } & IssuanceScenarioRequest> {
  const assetRepository = Container.get(AssetRepository)
  const personaRepository = Container.get(PersonaRepository)
  const issuerRepository = Container.get(IssuerRepository)

  const asset = await assetRepository.findById(assetId)
  const persona = await personaRepository.findById(personaId)
  const issuer = await issuerRepository.findById(issuerId)

  const scenario = await createTestScenario(asset, persona, issuer)
  const scenarioRequest = createApiIssuanceScenarioRequest(issuerId, personaId, assetId)

  return { id: scenario.id, ...scenarioRequest }
}
