import type { LeanIssuedCredentialDoc } from '../db/models/IssuedCredential'

import { Service } from 'typedi'

import { CredentialModel } from '../db/models/Credential'
import { IssuedCredentialModel } from '../db/models/IssuedCredential'
import logger from '../utils/logger'

import { revocationHandlers } from './revocationHandlers'

// Webhook payload shape (partial -- only fields we use)
export interface WebhookPayload {
  cred_ex_id?: string
  connection_id?: string
  rev_reg_id?: string
  cred_rev_id?: string
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
   * Called from WebhookController when an issuer_cred_rev event arrives (state=issued).
   * Creates the IssuedCredential doc with revocation metadata. The connection_id is
   * filled in later by handleCredentialIssued when the credential-issued event arrives.
   */
  public async handleIssuerCredRev(params: WebhookPayload): Promise<void> {
    const cred_ex_id = params.cred_ex_id
    const rev_reg_id = params.rev_reg_id as string | undefined
    const cred_rev_id = params.cred_rev_id as string | undefined
    if (!cred_ex_id || !rev_reg_id || !cred_rev_id) {
      logger.warn({ cred_ex_id, rev_reg_id, cred_rev_id }, 'issuer_cred_rev missing required fields, skipping')
      return
    }
    const insertDoc = {
      _id: cred_ex_id,
      format: 'anoncreds' as const,
      format_metadata: { rev_reg_id, cred_rev_id },
    }
    await IssuedCredentialModel.findOneAndUpdate({ _id: cred_ex_id }, { $setOnInsert: insertDoc }, { upsert: true })
    logger.info({ cred_ex_id, rev_reg_id, cred_rev_id }, 'IssuedCredential revocation metadata stored')
  }

  /**
   * Called from WebhookController when a credential-issued event arrives.
   * Adds connection_id and credential_id to the IssuedCredential doc created by
   * handleIssuerCredRev. Returns null if no revocable credential doc exists.
   */
  public async handleCredentialIssued(params: WebhookPayload): Promise<LeanIssuedCredentialDoc | null> {
    const cred_ex_id = params.cred_ex_id
    const connection_id = params.connection_id
    if (!cred_ex_id || !connection_id) return null

    const cred_def_id = params.by_format?.cred_issue?.anoncreds?.cred_def_id
    let credential_id: string | undefined
    if (cred_def_id) {
      const credDoc = await CredentialModel.findOne({ cred_def_id }).lean()
      if (credDoc) {
        credential_id = String(credDoc._id)
      } else {
        logger.warn({ cred_def_id }, 'No Credential doc found for cred_def_id')
      }
    }

    const lean = await IssuedCredentialModel.findOneAndUpdate(
      { _id: cred_ex_id },
      { $set: { connection_id, ...(credential_id ? { credential_id } : {}) } },
      { returnDocument: 'after' },
    ).lean<LeanIssuedCredentialDoc>()
    if (!lean) {
      logger.debug(
        { cred_ex_id },
        'No IssuedCredential doc found for credential-issued event (non-revocable credential)',
      )
      return null
    }
    logger.info({ cred_ex_id, connection_id }, 'IssuedCredential connection_id updated')
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
    if (!doc.connection_id) throw new Error(`IssuedCredential missing connection_id: ${credExId}`)

    await revocationHandlers[doc.format](doc.format_metadata, doc.connection_id)

    return updated
  }

  /** Return all issued credentials for a given connection. */
  public async getByConnection(connectionId: string): Promise<LeanIssuedCredentialDoc[]> {
    return IssuedCredentialModel.find({ connection_id: connectionId }).lean<LeanIssuedCredentialDoc[]>()
  }
}
