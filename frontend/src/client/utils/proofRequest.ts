import type { CredentialRequest, ProofRestriction } from '../slices/types'

export function buildRestrictions(item: CredentialRequest): ProofRestriction[] {
  const restriction: ProofRestriction = {}
  if (item.schema_id) restriction.schema_id = item.schema_id
  if (item.cred_def_id) restriction.cred_def_id = item.cred_def_id
  if (!item.schema_id && !item.cred_def_id) restriction.schema_name = item.name
  return [restriction]
}
