import {
  AriesProofRequest,
  AriesRequestCredentialAttributes,
  AriesRequestCredentialPredicates,
  ScenarioType,
  StepActionType
} from 'bc-wallet-openapi'

export interface RevocationRecord {
  connectionId: string
  revocationRegId: string
  credRevocationId: string
}

export interface Connection {
  id: string
  state: string
  invitationUrl: string
}

export interface ProofRequestData {
  connectionId: string
  attributes?: any[]
  predicates?: any[]
  nonRevoked?: { to: number; from?: number }
  requestOptions?: RequestOptions
}

export interface TextWithImage {
  text?: string
  image?: string
}

export interface Credential {
  name: string
  icon: string
  version: string
  attributes: CredentialAttribute[]
}

export interface CredentialAttribute {
  name: string
  value: string
}

export interface OnboardingStep {
  screenId: string
  title: string
  text: string
  issuer_name?: string
  image?: string
  credentials?: Credential[]
}

export interface CredentialRequest {
  name: string
  icon?: string
  schema_id?: string
  cred_def_id?: string
  predicates?: { name: string; value?: string | number | (() => string | number); type: string }///{ [key: string]: AriesRequestCredentialPredicates }//{ name: string; value?: string | number | (() => string | number); type: string }
  properties?: string[]//{ [key: string]: AriesRequestCredentialAttributes }//string[]
  nonRevoked?: { to: number; from?: number }
}

export interface CustomRequestOptions {
  title: string
  text: string
  requestedCredentials: CredentialRequest[]
}

export interface UseCaseScreen {
  screenId: string
  title: string
  text: string
  image?: string
  verifier?: { name: string; icon?: string }
  requestOptions?: CustomRequestOptions
}

export interface CustomUseCase {
  id: string
  name: string
  hidden?: boolean
  screens: UseCaseScreen[]
}

export interface ProgressBarStep {
  name: string
  onboardingStep: string
  iconLight: string
  iconDark: string
}

export interface RevocationInfoItem {
  credentialName: string
  credentialIcon: string
  title: string
  description: string
}

export interface CustomCharacter {
  name: string
  type: string
  image: string
  hidden?: boolean
  description?: string
  progressBar: ProgressBarStep[]
  onboarding: OnboardingStep[]
  useCases: CustomUseCase[]
  revocationInfo?: RevocationInfoItem[]
}

export interface UseCaseCard {
  title: string
  image: string
  description: string
}

export interface CredentialData {
  id: string
  icon: string
  name: string
  credentialDefinitionId: string
  properties?: { name: string }[]
  attributes?: Attribute[]
}

export interface Attribute {
  name: string
  value: string
}

export interface StepperItem {
  id: string
  name: string
  description: string
  steps: number
  section: number
}

export interface Overlay {
  header?: string
  subheader?: string
  footer?: string
}

export interface EndStepperItem {
  id: string
  title: string
  description: string
  image: string
}

export interface Colors {
  primary: string
  secondary: string
}

export interface RequestOptions {
  name?: string
  comment?: string
}

export interface Wallet {
  id: number
  name: string
  organization: string
  recommended: boolean
  icon: string
  url: string
  apple: string
  android: string
  ledgerImage?: string
}

export interface Showcase {
  id: string
  name: string
  slug: string
  description: string
  scenarios: Scenario[]
}

export interface Scenario {
  id: string
  slug: string
  name: string
  type: ScenarioType
  persona: Persona
  steps: Step[]
  issuer?: Issuer
  relyingParty?: RelyingParty
}

export interface Persona {
  id: string
  slug: string
  name: string
  role: string
  headshotImage?: string
  bodyImage?: string
}

export interface Step {
  title: string
  description: string
  asset?: string
  order: number
  actions?: StepAction[]
}

export interface StepAction {
  actionType: StepActionType
  title: string
  text: string
  credentialDefinitions?: CredentialDefinition[]
  proofRequest?: AriesProofRequest
}

export interface Issuer {
  name: string
  logo?: string
}

export interface CredentialDefinition {
  id: string
  version: string
  name: string
  icon?: string
  attributes: CredentialDefinitionAttribute[]
  identifier: string
}

export interface CredentialDefinitionAttribute {
  name: string
  value?: string
}

export interface RelyingParty {
  name: string
  logo?: string
}
