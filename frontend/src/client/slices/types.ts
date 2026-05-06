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

export interface ProofRestriction {
  schema_name?: string
  schema_id?: string
  cred_def_id?: string
}

export interface ProofAttributeRequest {
  restrictions: ProofRestriction[]
  names: string[]
  non_revoked?: { to: number; from?: number }
}

export interface ProofPredicateRequest {
  restrictions: ProofRestriction[]
  name: string
  //  Should already be resolved to a number by the time this gets to the frontend
  p_value?: number
  p_type: string
  non_revoked?: { to: number; from?: number }
}

export interface ProofRequestData {
  connectionId: string
  attributes?: Record<string, ProofAttributeRequest>
  predicates?: Record<string, ProofPredicateRequest>
  nonRevoked?: { to: number; from?: number }
  requestOptions?: RequestOptions
}

export interface TextWithImage {
  text?: string
  image?: string
}

export interface Credential {
  id: string
  name: string
  icon: string
  version: string
  attributes: {
    name: string
    value: string
  }[]
}

export interface IntroductionStep {
  screenId: string
  name: string
  text: string
  issuer_name?: string
  image?: string
  credentials?: Credential[]
}

type DateIntMarker = `$dateint:${number}`

export interface Predicate {
  name: string
  value?: number | DateIntMarker
  type: string
}

export interface CredentialRequest {
  name: string
  icon?: string
  schema_id?: string
  cred_def_id?: string
  predicates?: Predicate[]
  properties?: string[]
  nonRevoked?: { to: number | '$now'; from?: number | '$now' }
}

export interface CustomRequestOptions {
  name: string
  text: string
  requestedCredentials: CredentialRequest[]
}

export interface ScenarioScreen {
  screenId: string
  name: string
  text: string
  image?: string
  verifier?: { name: string; icon?: string }
  requestOptions?: CustomRequestOptions
}

export interface Scenario {
  id: string
  name: string
  hidden?: boolean
  screens: ScenarioScreen[]
}

export interface ProgressBarStep {
  name: string
  introductionStep: string
  iconLight: string
  iconDark: string
}

export interface RevocationInfoItem {
  credentialName: string
  credentialIcon: string
  name: string
  description: string
}

export interface Persona {
  name?: string
  type?: string
  image?: string
}

export type ShowcaseStatus = 'active' | 'hidden' | 'pending'

export interface Showcase {
  name: string
  status: ShowcaseStatus
  description?: string
  persona?: Persona
  credentials: Credential[]
  progressBar: ProgressBarStep[]
  introduction: IntroductionStep[]
  scenarios: Scenario[]
  revocationInfo?: RevocationInfoItem[]
}

export interface ScenarioCard {
  name: string
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
  name: string
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
