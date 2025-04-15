import type { CredentialDefinition, CredentialSchema } from 'bc-wallet-openapi'
import { type CredentialDefinitionSendRequest, type SchemaSendRequest } from 'bc-wallet-traction-openapi'

/**
 * Converts a CredentialSchema to a SchemaPostRequest
 * @param credentialSchema The credential definition to convert
 * @returns A SchemaPostRequest object
 */
export function credentialSchemaToSchemaPostRequest(credentialSchema: CredentialSchema): SchemaSendRequest {
  if (!credentialSchema.attributes) {
    throw new Error(
      `The credential schema ${credentialSchema.id} / ${credentialSchema.name} must at least contain one attribute`,
    )
  }

  const attributeNames = credentialSchema.attributes.map((attr) => attr.name)
  return {
    schemaName: credentialSchema.name,
    schemaVersion: credentialSchema.version,
    attributes: attributeNames,
  }
}

/**
 * Converts a CredentialDefinition to a CredDefPostRequest
 * @param credentialDef The credential definition to convert
 * @param schemaId The schema ID to use in the credential definition
 * @param issuerId
 * @returns A CredDefPostRequest object
 */
export function credentialDefinitionToCredentialDefinitionSendRequest(
  credentialDef: CredentialDefinition,
  schemaId: string,
  issuerId: string,
): CredentialDefinitionSendRequest {
  return {
    schemaId: schemaId,
    tag: credentialDef.version,
    supportRevocation: credentialDef.revocation !== undefined && credentialDef.revocation !== null,
    revocationRegistrySize: 1000,
  }
}

/**
 * Converts a GetCredDefResult to a CredDefResult
 * @param result The GetCredDefResult to convert
 * @returns A CredDefResult object
 */
/*export function getCredDefResultToCredDefResult(result: GetCredDefResult): CredDefResult {
  if (!result) {
    return {}
  }

  // Create a CredDefState from the credential definition
  const credentialDefinitionState: CredDefState = {
    credentialDefinition: result.credentialDefinition,
    credentialDefinitionId: result.credentialDefinitionId,
    state: 'finished', // FIXME double-check: Assume the state is finished since it was successfully retrieved
  }

  return {
    credentialDefinitionMetadata: result.credentialDefinitionsMetadata || {},
    credentialDefinitionState: credentialDefinitionState,
    registrationMetadata: result.resolutionMetadata || {},
    // jobId is left undefined as it doesn't exist in GetCredDefResult
  }
}*/

/*

function getRequiredAttribute(attributes: Array<CredentialAttribute>, name: string): string {
  const attr = attributes.find((att) => att.type === 'STRING' && att.name === name)
  if (!attr || !attr.value) {
    throw new Error(`Missing required attribute: ${name} in `)
  }
  return attr.value
}
*/
