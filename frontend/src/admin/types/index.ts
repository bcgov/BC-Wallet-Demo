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
  image?: string
  issuer_name?: string
  credentials?: Credential[]
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
  status?: ShowcaseStatus
  description?: string
  persona?: Persona
  progressBar: ProgressBarStep[]
  introduction: IntroductionStep[]
  scenarios: Scenario[]
  revocationInfo?: RevocationInfoItem[]
  credentials: Credential[]
}
