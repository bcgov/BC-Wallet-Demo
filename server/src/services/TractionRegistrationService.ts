import { isAxiosError } from 'axios'
import { BadRequestError } from 'routing-controllers'
import { Service } from 'typedi'

import logger from '../utils/logger'
import { retryWithExponentialBackoff, tractionRequest } from '../utils/tractionHelper'

// -- Types --

export interface TractionSchemaResponse {
  readonly data: {
    readonly schema_state: {
      readonly schema_id: string
      readonly schema: { readonly name: string }
    }
  }
}

export interface TractionCredDefResponse {
  readonly data: {
    readonly credential_definition_state: {
      readonly credential_definition_id: string
    }
  }
}

export interface CredDefOptions {
  readonly support_revocation?: boolean
  readonly revocation_registry_size?: number
}

// -- Functional core --

export const buildSchemaPayload = (name: string, version: string, attrNames: readonly string[], issuerId: string) =>
  ({
    schema: { name, version, attrNames, issuerId },
  }) as const

export const buildCredDefPayload = (issuerId: string, schemaId: string, tag: string, options?: CredDefOptions) =>
  ({
    credential_definition: { issuerId, schemaId, tag },
    options: {
      support_revocation: options?.support_revocation ?? true,
      revocation_registry_size: options?.revocation_registry_size ?? 3000,
    },
  }) as const

export const extractSchemaId = (res: TractionSchemaResponse): string => res.data.schema_state.schema_id

export const extractCredDefId = (res: TractionCredDefResponse): string =>
  res.data.credential_definition_state.credential_definition_id

export const toRegistrationError = (err: unknown, context: string): Error => {
  if (isAxiosError(err) && err.response && err.response.status < 500) {
    const detail = err.response?.data?.detail ?? err.message
    return new BadRequestError(`${context}: ${detail}`)
  }
  return err instanceof Error ? err : new Error(String(err))
}

// -- Imperative shell --

@Service()
export class TractionRegistrationService {
  public async registerSchema(
    name: string,
    version: string,
    attrNames: readonly string[],
    issuerId: string,
  ): Promise<string> {
    const payload = buildSchemaPayload(name, version, attrNames, issuerId)
    logger.debug({ name, version, issuerId }, 'Registering schema in Traction')
    try {
      const response = await tractionRequest.post('/anoncreds/schema', payload)
      return extractSchemaId(response as TractionSchemaResponse)
    } catch (err) {
      throw toRegistrationError(err, `Failed to register schema "${name}" v${version}`)
    }
  }

  public async registerCredentialDefinition(
    issuerId: string,
    schemaId: string,
    tag: string,
    options?: CredDefOptions,
  ): Promise<string> {
    const payload = buildCredDefPayload(issuerId, schemaId, tag, options)
    logger.debug({ schemaId, tag }, 'Registering credential definition in Traction')
    try {
      const response = await retryWithExponentialBackoff(
        () => tractionRequest.post('/anoncreds/credential-definition', payload),
        3,
        1000,
      )
      return extractCredDefId(response as TractionCredDefResponse)
    } catch (err) {
      throw toRegistrationError(err, `Failed to register credential definition for schema "${schemaId}"`)
    }
  }
}
