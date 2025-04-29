export const TOPICS = ['showcase-cmd', 'showcase-cmd-testing'] as const
export type Topic = (typeof TOPICS)[number]

export const ACTIONS = ['publish.issuer-assets', 'import.cred-schema', 'import.cred-def'] as const
export type Action = (typeof ACTIONS)[number]

export type CreateSchemaResult = {
  schemaId: string
  transactionId?: string
}

export type PublishCredentialDefinitionResult = {
  credentialDefinitionId?: string
  transactionId?: string
}
