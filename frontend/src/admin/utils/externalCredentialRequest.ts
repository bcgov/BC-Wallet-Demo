import type { CredentialRequest, NonRevokedInterval, Predicate, Showcase } from '../types'

export type ExternalCredentialFields = Pick<
  CredentialRequest,
  'schema_id' | 'cred_def_id' | 'properties' | 'predicates' | 'nonRevoked'
>

export const EXTERNAL_CREDENTIAL_JSON_TEMPLATE = JSON.stringify(
  {
    schema_id: 'did:sov:example:2:university_degree:1.0',
    cred_def_id: 'did:sov:example:3:CL:12345:1.0',
    properties: ['degree', 'institution'],
    predicates: [{ name: 'graduation_year', type: '>=', value: 2010 }],
    nonRevoked: { to: '$now' },
  },
  null,
  2,
)

const predicateTypes = new Set(['>=', '>', '<=', '<'])
const allowedKeys = new Set(['schema_id', 'cred_def_id', 'properties', 'predicates', 'nonRevoked'])

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isDateInt = (value: unknown): value is `$dateint:${number}` =>
  typeof value === 'string' && /^\$dateint:-?\d+$/.test(value)

const isDateOrNow = (value: unknown): value is number | '$now' =>
  (typeof value === 'number' && Number.isFinite(value)) || value === '$now'

const issuerPrefix = (value: string): string | undefined => {
  if (value.startsWith('did:')) return value.split(':').slice(0, 3).join(':')
  return value.split(':')[0]
}

const isQualifiedIdentifier = (value: string): boolean => value.startsWith('did:')

// Normalizes a single id or an OR-list of ids into an array
export const toIdList = (value?: string | string[]): string[] => {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// Accepts a single identifier or an array of alternatives (OR); rejects any other shape
const parseIdField = (value: unknown, fieldName: string, errors: string[]): string | string[] | undefined => {
  if (value === undefined) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) errors.push(`${fieldName} must be a non-empty string.`)
    return trimmed || undefined
  }
  if (Array.isArray(value) && value.length > 0 && value.every((entry) => typeof entry === 'string' && entry.trim())) {
    return value.map((entry) => (entry as string).trim())
  }
  errors.push(`${fieldName} must be a non-empty string or an array of non-empty strings.`)
  return undefined
}

export function parseExternalCredentialJson(raw: string): {
  value?: ExternalCredentialFields
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { errors: ['Enter valid JSON.'], warnings: [] }
  }

  if (!isObject(parsed)) return { errors: ['The JSON value must be an object.'], warnings: [] }

  Object.keys(parsed).forEach((key) => {
    if (!allowedKeys.has(key)) errors.push(`"${key}" is not supported here. Use the name and icon fields above.`)
  })

  const schemaId = parseIdField(parsed.schema_id, 'schema_id', errors)
  const credDefId = parseIdField(parsed.cred_def_id, 'cred_def_id', errors)
  const schemaIds = toIdList(schemaId)
  const credDefIds = toIdList(credDefId)
  if (schemaIds.length === 0 && credDefIds.length === 0)
    errors.push('Provide at least one of schema_id or cred_def_id.')

  if (schemaIds.some((id) => !isQualifiedIdentifier(id) && !/^.+:2:.+:.+$/.test(id))) {
    warnings.push('schema_id does not match a recognized AnonCreds identifier format.')
  }
  if (credDefIds.some((id) => !isQualifiedIdentifier(id) && !/^.+:3:CL:.+:.+$/.test(id))) {
    warnings.push('cred_def_id does not match a recognized AnonCreds identifier format.')
  }
  if (
    schemaIds.length > 0 &&
    credDefIds.length > 0 &&
    schemaIds.some((s) => credDefIds.some((c) => issuerPrefix(s) !== issuerPrefix(c)))
  ) {
    warnings.push('schema_id and cred_def_id appear to use different issuer prefixes.')
  }

  let properties: string[] | undefined
  if (parsed.properties !== undefined) {
    if (
      !Array.isArray(parsed.properties) ||
      parsed.properties.some((property) => typeof property !== 'string' || !property.trim())
    ) {
      errors.push('properties must be an array of non-empty strings.')
    } else {
      properties = parsed.properties.map((property) => property.trim())
      if (new Set(properties).size !== properties.length) errors.push('properties must not contain duplicates.')
    }
  }

  const predicates: Predicate[] = []
  if (parsed.predicates !== undefined) {
    if (!Array.isArray(parsed.predicates)) {
      errors.push('predicates must be an array.')
    } else {
      parsed.predicates.forEach((predicate, index) => {
        if (!isObject(predicate) || typeof predicate.name !== 'string' || !predicate.name.trim()) {
          errors.push(`predicates[${index}].name must be a non-empty string.`)
          return
        }
        if (typeof predicate.type !== 'string' || !predicateTypes.has(predicate.type)) {
          errors.push(`predicates[${index}].type must be one of >=, >, <=, <.`)
          return
        }
        if (!(
          (typeof predicate.value === 'number' && Number.isFinite(predicate.value)) ||
          isDateInt(predicate.value)
        )) {
          errors.push(`predicates[${index}].value must be a number or $dateint marker.`)
          return
        }
        predicates.push({ name: predicate.name.trim(), type: predicate.type, value: predicate.value })
      })
    }
  }

  let nonRevoked: NonRevokedInterval | undefined
  if (parsed.nonRevoked !== undefined) {
    if (!isObject(parsed.nonRevoked) || !isDateOrNow(parsed.nonRevoked.to)) {
      errors.push('nonRevoked.to must be a finite number or "$now".')
    } else if (parsed.nonRevoked.from !== undefined && !isDateOrNow(parsed.nonRevoked.from)) {
      errors.push('nonRevoked.from must be a finite number or "$now".')
    } else {
      nonRevoked = { to: parsed.nonRevoked.to }
      if (parsed.nonRevoked.from !== undefined) nonRevoked.from = parsed.nonRevoked.from
    }
  }

  if ((!properties || properties.length === 0) && (!predicates || predicates.length === 0)) {
    errors.push('Provide at least one property or predicate.')
  }

  if (errors.length > 0) return { errors, warnings }
  return {
    value: {
      schema_id: schemaId,
      cred_def_id: credDefId,
      properties,
      predicates: predicates.length > 0 ? predicates : undefined,
      nonRevoked,
    },
    errors,
    warnings,
  }
}

export function buildExternalCredentialRequest(
  name: string,
  icon: string | undefined,
  fields: ExternalCredentialFields,
): CredentialRequest {
  return {
    name: name.trim(),
    ...(icon ? { icon } : {}),
    ...(fields.schema_id ? { schema_id: fields.schema_id } : {}),
    ...(fields.cred_def_id ? { cred_def_id: fields.cred_def_id } : {}),
    ...(fields.properties?.length ? { properties: fields.properties } : {}),
    ...(fields.predicates?.length ? { predicates: fields.predicates } : {}),
    ...(fields.nonRevoked ? { nonRevoked: fields.nonRevoked } : {}),
  }
}

export function isExternalCredentialRequest(request: CredentialRequest, showcase: Showcase): boolean {
  if (request.cred_id) return false
  return !showcase.credentials.some(
    (credential) =>
      (credential.schema_id && toIdList(request.schema_id).includes(credential.schema_id)) ||
      (credential.cred_def_id && toIdList(request.cred_def_id).includes(credential.cred_def_id)),
  )
}
