export interface Credential {
  id: string
  name: string
  icon: string
  version: string
  attributes: {
    name: string
    value: string
  }[]
  schema_id?: string
  cred_def_id?: string
  status: 'active' | 'retired'
}

// Input shape for the create credential API. schema_id and cred_def_id are
// populated by sync with Traction; status defaults to 'active'. id is derived
// from name + version server-side.
export type CreateCredentialInput = Omit<Credential, 'id' | 'schema_id' | 'cred_def_id' | 'status'>

export interface Schema {
  id: string
  name: string
  version: string
  attrNames: string[]
  credDefId?: string
}

// Input shape for the create schema API. id is derived from the Traction response server-side.
export type CreateSchemaInput = Omit<Schema, 'id'>

export interface IntroductionStep {
  screenId: string
  name: string
  text: string
  image?: string
  issuer_name?: string
  credentials?: string[]
}

export interface CustomWebSocket extends WebSocket {
  isAlive: boolean
  connectionId?: string
}

type DateIntMarker = `$dateint:${number}`

export interface Predicate {
  name: string
  type: string
  value?: number | DateIntMarker
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
  deleted_at?: Date | null
  description?: string
  persona?: Persona
  progressBar: ProgressBarStep[]
  introduction: IntroductionStep[]
  scenarios: Scenario[]
  revocationInfo?: RevocationInfoItem[]
  credentials: string[]
}

export interface ScenarioCard {
  name: string
  image?: string
  description: string
}

export interface CredentialData {
  id: string
  name: string
  icon: string
  credentialDefinition?: string
  attributes: Attribute[]
  connectionId: string
}

export interface Attribute {
  name: string
  value: string | number
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
