import {
  Asset as AssetDTO,
  AssetRequest,
  CredentialDefinition as CredentialDefinitionDTO,
  CredentialSchema as CredentialSchemaDTO,
  IssuanceScenario as IssuanceScenarioDTO,
  Issuer as IssuerDTO,
  Persona as PersonaDTO,
  PresentationScenario as PresentationScenarioDTO,
  RelyingParty as RelyingPartyDTO,
  Showcase as ShowcaseDTO,
  Step as StepDTO,
} from 'bc-wallet-openapi'
import {
  Asset,
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
  Showcase,
  Step,
} from '../types'

export const newAssetFrom = (asset: AssetRequest): NewAsset => {
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

export const stepDTOFrom = (step: Step): StepDTO => {
  return {
    ...step,
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
    credentialDefinitions: showcase.credentialDefinitions.map(credentialDefinitionDTOFrom),
    scenarios: showcase.scenarios.map(scenarioDTOFrom),
    bannerImage: showcase.bannerImage ? assetDTOFrom(showcase.bannerImage) : undefined,
    completionMessage: showcase.completionMessage || undefined,
  }
}

export const isPresentationScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'relyingParty' in scenario
}

export const isIssuanceScenario = (scenario: Scenario | NewScenario): boolean => {
  return 'issuer' in scenario
}
