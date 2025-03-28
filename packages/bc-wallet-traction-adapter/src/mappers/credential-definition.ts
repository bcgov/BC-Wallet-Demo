import { CredentialDefinition, CredentialSchema } from 'bc-wallet-openapi'
import {
  AnonCredsSchema,
  CredDefPostOptions,
  CredDefPostRequest,
  CredDefResult,
  CredDefState,
  GetCredDefResult,
  InnerCredDef,
  SchemaPostRequest,
} from 'bc-wallet-traction-openapi'

/**
 * Converts a CredentialSchema to a SchemaPostRequest
 * @param credentialSchema The credential definition to convert
 * @param issuerId
 * @returns A SchemaPostRequest object
 */
export function credentialSchemaToSchemaPostRequest(credentialSchema: CredentialSchema, issuerId: string): SchemaPostRequest {
  if (!credentialSchema.attributes) {
    throw new Error(`The credential schema ${credentialSchema.id} / ${credentialSchema.name} must at least contain one atttribute`)
  }

  const attributeNames = credentialSchema.attributes.map((attr) => attr.name)
  const schema: AnonCredsSchema = {
    attrNames: attributeNames,
    issuerId,
    name: credentialSchema.name,
    version: credentialSchema.version,
  }

  return {
    schema,
  }
}

/**
 * Converts a CredentialDefinition to a CredDefPostRequest
 * @param credentialDef The credential definition to convert
 * @param schemaId The schema ID to use in the credential definition
 * @param issuerId
 * @returns A CredDefPostRequest object
 */
export function credentialDefinitionToCredDefPostRequest(
  credentialDef: CredentialDefinition,
  schemaId: string,
  issuerId: string,
): CredDefPostRequest {
  const innerCredDef: InnerCredDef = {
    issuerId: issuerId,
    schemaId: schemaId,
    tag: credentialDef.version,
  }

  return {
    credentialDefinition: innerCredDef,
    options: getOptions(credentialDef),
  }
}

/**
 * Maps credential type to a supported revocation configuration
 * @param credDef The credential definition
 * @returns Options with revocation settings
 */
export function getOptions(credDef: CredentialDefinition): CredDefPostOptions {
  if (!credDef.revocation) {
    return {
      supportRevocation: false,
    }
  }

  // Default registry size since we don't have access to the actual structure
  return {
    supportRevocation: true,
    revocationRegistrySize: 1000, // Default size
  }
}

/**
 * Converts a GetCredDefResult to a CredDefResult
 * @param result The GetCredDefResult to convert
 * @returns A CredDefResult object
 */
export function getCredDefResultToCredDefResult(result: GetCredDefResult): CredDefResult {
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
}
/*

function getRequiredAttribute(attributes: Array<CredentialAttribute>, name: string): string {
  const attr = attributes.find((att) => att.type === 'STRING' && att.name === name)
  if (!attr || !attr.value) {
    throw new Error(`Missing required attribute: ${name} in `)
  }
  return attr.value
}
*/
