import type { Credential } from '../content/types'
import type { LeanCredentialDoc } from '../db/models/Credential'

export function toCredentialResponse(doc: LeanCredentialDoc): Credential {
  return {
    id: String(doc._id),
    name: doc.name,
    icon: doc.icon,
    version: doc.version,
    attributes: doc.attributes || [],
    schema_id: doc.schema_id,
    cred_def_ids: doc.cred_def_ids || [],
    status: doc.status || 'active',
  }
}
