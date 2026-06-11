import type { LeanIssuedCredentialDoc } from '../db/models/IssuedCredential'

import { Service } from 'typedi'

import { CredentialModel } from '../db/models/Credential'
import { IssuedCredentialModel } from '../db/models/IssuedCredential'
import logger from '../utils/logger'

import { revocationHandlers } from './revocationHandlers'

// -- Functional core --

export interface IssuedCredentialInput {
  _id: string
  credential_id?: string
  connection_id: string
  format: 'anoncreds'
  format_metadata: Record<string, unknown>
}

// Webhook payload shape (partial -- only fields we use)
export interface WebhookPayload {
  cred_ex_id?: string
  connection_id?: string
  revoc_reg_id?: string
  revocation_id?: string
  by_format?: {
    cred_issue?: {
      anoncreds?: {
        cred_def_id?: string
      }
    }
  }
  [key: string]: unknown
}

/**
 * Pure: extract issuance data from a webhook payload.
 * Returns null when the payload lacks revocation metadata (non-revocable cred).
 * Currently AnonCreds-specific -- when mdoc lands, add format detection and a
 * parallel extraction function keyed by format (same pattern as handlers).
 */
export const extractIssuanceData = (params: WebhookPayload): IssuedCredentialInput | null => {
  const rev_reg_id = params.revoc_reg_id
  const cred_rev_id = params.revocation_id
  const cred_def_id = params.by_format?.cred_issue?.anoncreds?.cred_def_id
  if (!params.cred_ex_id || !rev_reg_id || !cred_rev_id || !params.connection_id) return null
  return {
    _id: params.cred_ex_id,
    credential_id: undefined,
    connection_id: params.connection_id,
    format: 'anoncreds',
    format_metadata: { rev_reg_id, cred_rev_id, cred_def_id },
  }
}

/**
 * Pure: validate IssuedCredential fields only (status, format support).
 * The `revocable` check on the parent Credential lives in the imperative
 * shell where both documents are available.
 */
export const validateRevocation = (doc: LeanIssuedCredentialDoc): string | null => {
  if (doc.status === 'revoked') return 'credential already revoked'
  if (!revocationHandlers[doc.format]) return `unsupported format: ${doc.format}`
  return null
}

// -- Imperative shell --

@Service()
export class RevocationService {
  /**
   * Called from WebhookController when a credential-issued event arrives.
   * Looks up the internal Credential by cred_def_id, writes an IssuedCredential
   * doc, and returns it. Returns null if the payload has no revocation metadata.
   */
  public async handleCredentialIssued(params: WebhookPayload): Promise<LeanIssuedCredentialDoc | null> {
    const input = extractIssuanceData(params)
    if (!input) return null

    // Resolve the internal credential_id via cred_def_id stored on the Credential doc
    const cred_def_id =
      typeof input.format_metadata.cred_def_id === 'string' ? input.format_metadata.cred_def_id : undefined
    if (cred_def_id) {
      const credDoc = await CredentialModel.findOne({ cred_def_id }).lean()
      if (credDoc) {
        input.credential_id = String(credDoc._id)
      } else {
        logger.warn({ cred_def_id }, 'No Credential doc found for cred_def_id; storing with empty credential_id')
      }
    }

    const lean = await IssuedCredentialModel.findOneAndUpdate(
      { _id: input._id },
      { $setOnInsert: input },
      { upsert: true, returnDocument: 'after' },
    ).lean<LeanIssuedCredentialDoc>()
    if (!lean) throw new Error(`IssuedCredential upsert returned null for _id: ${input._id}`)
    logger.info({ cred_ex_id: lean._id, connection_id: lean.connection_id }, 'IssuedCredential persisted')
    return lean
  }

  /**
   * Revoke a previously issued credential by its cred_ex_id.
   * Dispatches to the appropriate format handler, then updates status.
   */
  public async revokeCredential(credExId: string): Promise<LeanIssuedCredentialDoc> {
    const doc = await IssuedCredentialModel.findById(credExId).lean<LeanIssuedCredentialDoc>()
    if (!doc) throw new Error(`IssuedCredential not found: ${credExId}`)

    const validationError = validateRevocation(doc)
    if (validationError) throw new Error(validationError)

    // Update DB before calling Traction: if the Traction call fails, the DB
    // correctly reflects the intent and a retry will see 'already revoked' (400)
    // rather than re-attempting the Traction call with an unknown outcome.
    const updated = await IssuedCredentialModel.findByIdAndUpdate(
      credExId,
      { status: 'revoked', revoked_at: new Date() },
      { returnDocument: 'after' },
    ).lean<LeanIssuedCredentialDoc>()

    if (!updated) throw new Error(`IssuedCredential disappeared during revocation: ${credExId}`)

    await revocationHandlers[doc.format](doc.format_metadata, doc.connection_id)

    return updated
  }

  /** Return all issued credentials for a given connection. */
  public async getByConnection(connectionId: string): Promise<LeanIssuedCredentialDoc[]> {
    return IssuedCredentialModel.find({ connection_id: connectionId }).lean<LeanIssuedCredentialDoc[]>()
  }
}
