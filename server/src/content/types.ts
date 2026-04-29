export interface Credential {
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
  image?: string
  issuer_name?: string
  credentialNames?: string[]
}

export interface CustomWebSocket extends WebSocket {
  isAlive: boolean
  connectionId?: string
}

export interface Predicate {
  name: string
  type: string
  value?: string | number | (() => string | number)
}

export interface CredentialRequest {
  name: string
  icon?: string
  schema_id?: string
  cred_def_id?: string
  predicates?: Predicate[]
  properties?: string[]
  nonRevoked?: { to: number; from?: number }
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
  name: string
  type: string
  image: string
}

export interface Showcase {
  name: string
  hidden?: boolean
  description?: string
  persona: Persona
  credentials: Credential[]
  progressBar: ProgressBarStep[]
  introduction: IntroductionStep[]
  scenarios: Scenario[]
  revocationInfo?: RevocationInfoItem[]
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
  value: string | number | (() => string | number)
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
