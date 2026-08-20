import type { CredentialRequest } from '../../slices/types'

import { describe, expect, it } from 'vitest'

import { buildRestrictions, toIdList } from '../proofRequest'

describe('toIdList', () => {
  it('returns an empty array for undefined', () => {
    expect(toIdList(undefined)).toEqual([])
  })

  it('wraps a single string in an array', () => {
    expect(toIdList('abc')).toEqual(['abc'])
  })

  it('passes an array through, filtering out empty entries', () => {
    expect(toIdList(['a', '', 'b'])).toEqual(['a', 'b'])
  })
})

describe('buildRestrictions', () => {
  const base: CredentialRequest = { name: 'Card' }

  it('builds a single restriction from a legacy scalar schema_id', () => {
    expect(buildRestrictions({ ...base, schema_id: 'schema-1' })).toEqual([{ schema_id: 'schema-1' }])
  })

  it('builds a single restriction from a legacy scalar cred_def_id', () => {
    expect(buildRestrictions({ ...base, cred_def_id: 'creddef-1' })).toEqual([{ cred_def_id: 'creddef-1' }])
  })

  it('builds one restriction per entry for an array cred_def_id (OR)', () => {
    expect(buildRestrictions({ ...base, cred_def_id: ['creddef-1', 'creddef-2'] })).toEqual([
      { cred_def_id: 'creddef-1' },
      { cred_def_id: 'creddef-2' },
    ])
  })

  it('combines schema_id and cred_def_id entries into a cartesian product of restrictions', () => {
    expect(buildRestrictions({ ...base, schema_id: ['schema-1', 'schema-2'], cred_def_id: 'creddef-1' })).toEqual([
      { schema_id: 'schema-1', cred_def_id: 'creddef-1' },
      { schema_id: 'schema-2', cred_def_id: 'creddef-1' },
    ])
  })

  it('falls back to schema_name when neither identifier is present', () => {
    expect(buildRestrictions(base)).toEqual([{ schema_name: 'Card' }])
  })
})
