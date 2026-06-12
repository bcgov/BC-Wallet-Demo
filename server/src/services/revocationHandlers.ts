import { tractionRequest } from '../utils/tractionHelper'

export type RevokeHandler = (formatMetadata: Record<string, unknown>, connectionId: string) => Promise<void>

// To add a new format:
// 1. Add a handler function to this map keyed by the format string
//    (must match the `format` field stored on IssuedCredential)
// 2. Add the format string to the IssuedCredential model enum
// 3. If the handler is complex, extract it to its own file and import here
// 4. Update extractIssuanceData in RevocationService.ts to detect and
//    extract metadata for the new format from the webhook payload
export const revocationHandlers: Record<string, RevokeHandler> = {
  anoncreds: async (metadata, connectionId) => {
    const { rev_reg_id, cred_rev_id } = metadata
    await tractionRequest.post('/anoncreds/revocation/revoke', {
      connection_id: connectionId,
      cred_rev_id,
      rev_reg_id,
      publish: true,
      notify: true,
      notify_version: 'v1_0',
      comment: 'Credential Revoked',
      thread_id: `indy::${rev_reg_id}::${cred_rev_id}`,
    })
  },
  // mdoc: async (metadata, connectionId) => { ... }
}
