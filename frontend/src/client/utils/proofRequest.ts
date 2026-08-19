import type { CredentialRequest, ProofRestriction } from '../slices/types'

// Normalizes a single id or an OR-list of ids into an array
export function toIdList(value?: string | string[]): string[] {
  if (!value) return []
  return (Array.isArray(value) ? value : [value]).filter((entry) => !!entry)
}

export function buildRestrictions(item: CredentialRequest): ProofRestriction[] {
  const restrictions = [
    ...toIdList(item.schema_id).map((schema_id) => ({ schema_id })),
    ...toIdList(item.cred_def_id).map((cred_def_id) => ({ cred_def_id })),
  ]
  return restrictions.length > 0 ? restrictions : [{ schema_name: item.name }]
}
