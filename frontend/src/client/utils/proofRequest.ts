import type { CredentialRequest, ProofRestriction } from '../slices/types'

// Normalizes a single id or an OR-list of ids into an array
export function toIdList(value?: string | string[]): string[] {
  if (!value) return []
  return (Array.isArray(value) ? value : [value]).filter((entry) => !!entry)
}

export function buildRestrictions(item: CredentialRequest): ProofRestriction[] {
  const schemaIds = toIdList(item.schema_id)
  const credDefIds = toIdList(item.cred_def_id)
  const restrictions =
    schemaIds.length > 0 && credDefIds.length > 0
      ? schemaIds.flatMap((schema_id) => credDefIds.map((cred_def_id) => ({ schema_id, cred_def_id })))
      : [...schemaIds.map((schema_id) => ({ schema_id })), ...credDefIds.map((cred_def_id) => ({ cred_def_id }))]
  return restrictions.length > 0 ? restrictions : [{ schema_name: item.name }]
}
