import {
  AcceptCredentialAction as AcceptCredentialActionDTO,
  AriesOOBAction as AriesOOBActionDTO,
  AriesProofRequest as AriesProofRequestDTO,
  Asset as AssetDTO,
  AssetRequest as AssetRequestDTO,
  ButtonAction as ButtonActionDTO,
  ChooseWalletAction as ChooseWalletActionDTO,
  CredentialDefinition as CredentialDefinitionDTO,
  CredentialSchema as CredentialSchemaDTO,
  IssuanceScenario as IssuanceScenarioDTO,
  Issuer as IssuerDTO,
  Persona as PersonaDTO,
  PresentationScenario as PresentationScenarioDTO,
  RelyingParty as RelyingPartyDTO,
  SetupConnectionAction as SetupConnectionActionDTO,
  ShareCredentialAction as ShareCredentialActionDTO,
  Showcase as ShowcaseDTO,
  Step as StepDTO,
  StepAction as StepActionDTO,
  User as UserDTO,
} from 'bc-wallet-openapi'
import {
  AcceptCredentialAction,
  AriesOOBAction,
  Asset,
  ButtonAction,
  CredentialDefinition,
  CredentialSchema,
  IssuanceScenario,
  Issuer,
  NewAsset,
  NewScenario,
  Persona,
  PresentationScenario,
  RelyingParty,
  Scenario,
  ScenarioType,
  ShareCredentialAction,
  Showcase,
  Step,
  StepActionType,
  StepActionTypes,
  User,
} from '../types'

export const newAssetFrom = (asset: AssetRequestDTO): NewAsset => {
  return {
    ...asset,
    content: Buffer.from(asset.content),
  }
}

export const assetDTOFrom = (asset: Asset): AssetDTO => {
  return {
    ...asset,
    fileName: asset.fileName || undefined,
    description: asset.description || undefined,
    content: asset.content.toString(),
  }
}

export const credentialSchemaDTOFrom = (credentialSchema: CredentialSchema): CredentialSchemaDTO => {
  return {
    ...credentialSchema,
    identifierType: credentialSchema.identifierType || undefined,
    identifier: credentialSchema.identifier || undefined,
    source: credentialSchema.source || undefined,
  }
}

export const credentialDefinitionDTOFrom = (credentialDefinition: CredentialDefinition): CredentialDefinitionDTO => {
  return {
    ...credentialDefinition,
    identifierType: credentialDefinition.identifierType || undefined,
    identifier: credentialDefinition.identifier || undefined,
    credentialSchema: credentialSchemaDTOFrom(credentialDefinition.credentialSchema),
    representations: credentialDefinition.representations,
    revocation: credentialDefinition.revocation || undefined,
    icon: credentialDefinition.icon ? assetDTOFrom(credentialDefinition.icon) : undefined,
  }
}

export const relyingPartyDTOFrom = (relyingParty: RelyingParty): RelyingPartyDTO => {
  return {
    ...relyingParty,
    organization: relyingParty.organization || undefined,
    logo: relyingParty.logo ? assetDTOFrom(relyingParty.logo) : undefined,
    credentialDefinitions: relyingParty.credentialDefinitions.map(credentialDefinitionDTOFrom),
  }
}

export const issuerDTOFrom = (issuer: Issuer): IssuerDTO => {
  return {
    ...issuer,
    organization: issuer.organization || undefined,
    logo: issuer.logo ? assetDTOFrom(issuer.logo) : undefined,
    credentialDefinitions: issuer.credentialDefinitions.map(credentialDefinitionDTOFrom),
    credentialSchemas: issuer.credentialSchemas.map(credentialSchemaDTOFrom),
  }
}

export const issuanceScenarioDTOFrom = (issuanceScenario: IssuanceScenario): IssuanceScenarioDTO => {
  if (!issuanceScenario.issuer) {
    throw Error('Missing issuer in issuance scenario')
  }

  return {
    ...issuanceScenario,
    issuer: issuerDTOFrom(issuanceScenario.issuer),
    type: ScenarioType.ISSUANCE,
    steps: issuanceScenario.steps.map(stepDTOFrom),
    personas: issuanceScenario.personas.map(personaDTOFrom),
  }
}

export const presentationScenarioDTOFrom = (presentationScenario: PresentationScenario): PresentationScenarioDTO => {
  if (!presentationScenario.relyingParty) {
    throw Error('Missing relying party in presentation scenario')
  }

  return {
    ...presentationScenario,
    relyingParty: relyingPartyDTOFrom(presentationScenario.relyingParty),
    type: ScenarioType.PRESENTATION,
    steps: presentationScenario.steps.map(stepDTOFrom),
    personas: presentationScenario.personas.map(personaDTOFrom),
  }
}

export const scenarioDTOFrom = (scenario: Scenario): IssuanceScenarioDTO | PresentationScenarioDTO => {
  switch (scenario.scenarioType) {
    case ScenarioType.PRESENTATION:
      return presentationScenarioDTOFrom(scenario as PresentationScenario)
    case ScenarioType.ISSUANCE:
      return issuanceScenarioDTOFrom(scenario as IssuanceScenario)
    default:
      throw Error(`Unsupported scenario type ${scenario.scenarioType}`)
  }
}

export const stepActionDTOFrom = (stepAction: StepActionTypes): StepActionDTO => {
  const baseAction = {
    id: stepAction.id,
    actionType: stepAction.actionType,
    title: stepAction.title,
    text: stepAction.text,
    createdAt: stepAction.createdAt,
    updatedAt: stepAction.updatedAt,
  }

  // Handle specific action types with their unique properties
  switch (stepAction.actionType) {
    case StepActionType.ACCEPT_CREDENTIAL: {
      const action = stepAction as AcceptCredentialAction
      const acceptCredentialDTO: AcceptCredentialActionDTO = {
        ...baseAction,
        credentialDefinitionId: action.credentialDefinitionId,
        connectionId: action.connectionId || undefined,
      }
      return acceptCredentialDTO
    }
    case StepActionType.SHARE_CREDENTIAL: {
      const action = stepAction as ShareCredentialAction
      const shareCredentialDTO: ShareCredentialActionDTO = {
        ...baseAction,
        credentialDefinitionId: action.credentialDefinitionId,
        connectionId: action.connectionId || undefined,
      }
      return shareCredentialDTO
    }
    case StepActionType.BUTTON: {
      const action = stepAction as ButtonAction
      const buttonDTO: ButtonActionDTO = {
        ...baseAction,
        goToStep: action.goToStep || undefined,
      }
      return buttonDTO
    }
    case StepActionType.ARIES_OOB: {
      const action = stepAction as AriesOOBAction
      const ariesOOBDTO: AriesOOBActionDTO = {
        ...baseAction,
        proofRequest: action.proofRequest as AriesProofRequestDTO, // FIXME, no idea how yet
      }
      return ariesOOBDTO
    }
    case StepActionType.CHOOSE_WALLET: {
      const chooseWalletDTO: ChooseWalletActionDTO = {
        ...baseAction,
      }
      return chooseWalletDTO
    }
    case StepActionType.SETUP_CONNECTION: {
      const setupConnectionDTO: SetupConnectionActionDTO = {
        ...baseAction,
      }
      return setupConnectionDTO
    }
    default:
      throw Error(`Unknown step action action type: ${stepAction['actionType']}`)
  }
}

export const stepDTOFrom = (step: Step): StepDTO => {
  return {
    ...step,
    actions: step.actions.map(stepActionDTOFrom),
    asset: step.asset ? assetDTOFrom(step.asset) : undefined,
    subScenario: step.subScenario || undefined
  }
}

export const personaDTOFrom = (persona: Persona): PersonaDTO => {
  return {
    ...persona,
    headshotImage: persona.headshotImage ? assetDTOFrom(persona.headshotImage) : undefined,
    bodyImage: persona.bodyImage ? assetDTOFrom(persona.bodyImage) : undefined,
    hidden: persona.hidden,
  }
}

export const showcaseDTOFrom = (showcase: Showcase): ShowcaseDTO => {
  return {
    ...showcase,
    personas: showcase.personas.map(personaDTOFrom),
    scenarios: showcase.scenarios.map(scenarioDTOFrom),
    bannerImage: showcase.bannerImage ? assetDTOFrom(showcase.bannerImage) : undefined,
    completionMessage: showcase.completionMessage || undefined,
    createdBy: showcase.createdBy ? userDTOFrom(showcase.createdBy) : undefined,
  }
}

export const userDTOFrom = (user: User): UserDTO => {
  return {
    ...user,
    identifierType: user.identifierType ?? undefined,
    identifier: user.identifier ?? undefined,
  }
}

export const isPresentationScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'relyingParty' in scenario
}

export const isIssuanceScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'issuer' in scenario
}
