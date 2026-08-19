import { describe, expect, it } from 'vitest'

import {
  EXTERNAL_CREDENTIAL_JSON_TEMPLATE,
  buildExternalCredentialRequest,
  parseExternalCredentialJson,
} from '../externalCredentialRequest'

describe('external credential request parsing', () => {
  it('accepts a valid credential definition request', () => {
    const result = parseExternalCredentialJson(EXTERNAL_CREDENTIAL_JSON_TEMPLATE)

    expect(result.errors).toEqual([])
    expect(result.value).toMatchObject({
      cred_def_id: 'did:sov:example:3:CL:12345:1.0',
      properties: ['attribute_name'],
    })
  })

  it('rejects invalid JSON and unsupported fields', () => {
    expect(parseExternalCredentialJson('{').errors).toContain('Enter valid JSON.')
    expect(parseExternalCredentialJson('{"name":"outside"}').errors).toContain(
      '"name" is not supported here. Use the name and icon fields above.',
    )
  })

  it('requires an identifier and an attribute or predicate', () => {
    expect(parseExternalCredentialJson('{"properties":["name"]}').errors).toContain(
      'Provide at least one of schema_id or cred_def_id.',
    )
    expect(parseExternalCredentialJson('{"cred_def_id":"abc"}').errors).toContain(
      'Provide at least one property or predicate.',
    )
  })

  it('validates properties, predicates, and non-revocation', () => {
    const result = parseExternalCredentialJson(
      JSON.stringify({
        cred_def_id: 'abc',
        properties: ['name', 'name'],
        predicates: [{ name: 'age', type: '==', value: 18 }],
        nonRevoked: { to: 'tomorrow' },
      }),
    )

    expect(result.errors).toEqual(
      expect.arrayContaining([
        'properties must not contain duplicates.',
        'predicates[0].type must be one of >=, >, <=, <.',
        'nonRevoked.to must be a finite number or "$now".',
      ]),
    )
  })

  it('accepts date markers and emits non-empty request fields', () => {
    const result = parseExternalCredentialJson(
      JSON.stringify({
        schema_id: 'did:sov:example:2:degree:1.0',
        properties: ['name'],
        predicates: [{ name: 'graduation_year', type: '>=', value: '$dateint:-5' }],
        nonRevoked: { to: '$now' },
      }),
    )
    expect(result.errors).toEqual([])
    expect(buildExternalCredentialRequest('Degree', '/icon.svg', result.value!)).toEqual({
      name: 'Degree',
      icon: '/icon.svg',
      schema_id: 'did:sov:example:2:degree:1.0',
      properties: ['name'],
      predicates: [{ name: 'graduation_year', type: '>=', value: '$dateint:-5' }],
      nonRevoked: { to: '$now' },
    })
  })

  it('reports identifier warnings without blocking a valid request', () => {
    const result = parseExternalCredentialJson(
      JSON.stringify({ schema_id: 'schema', cred_def_id: 'creddef', properties: ['name'] }),
    )
    expect(result.errors).toEqual([])
    expect(result.warnings).toHaveLength(2)
  })
})
