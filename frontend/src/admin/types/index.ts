export interface Credential {
  name: string
  icon: string
  version: string
  attributes: {
    name: string
    value: string
  }[]
}

export interface OnboardingStep {
  screenId: string
  title: string
  text: string
  image?: string
  issuer_name?: string
  credentials?: Credential[]
}

export interface CredentialRequest {
  name: string
  icon?: string
  schema_id?: string
  cred_def_id?: string
  predicates?: { name: string; value?: string | number | (() => string | number); type: string }
  properties?: string[]
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
  credentials: Credential[]
  progressBar: ProgressBarStep[]
  onboarding: OnboardingStep[]
  useCases: CustomUseCase[]
  revocationInfo?: RevocationInfoItem[]
}

export function formatScreenId(id: string): string {
  return id
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
