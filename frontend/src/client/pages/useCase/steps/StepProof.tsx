import type {
  CredentialRequest,
  ProofAttributeRequest,
  ProofPredicateRequest,
  ProofRestriction,
  ScenarioScreen,
} from '../../../slices/types'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

import { fadeX } from '../../../FramerAnimations'
import { ActionCTA } from '../../../components/ActionCTA'
import { useAppDispatch } from '../../../hooks/hooks'
import { useConnection } from '../../../slices/connection/connectionSelectors'
import { createProof, deleteProofById, createDeepProof, fetchProofById } from '../../../slices/proof/proofThunks'
import { useSocket } from '../../../slices/socket/socketSelector'
import { FailedRequestModal } from '../../introduction/components/FailedRequestModal'
import { ProofAttributesCard } from '../components/ProofAttributesCard'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  proof?: any
  step: ScenarioScreen
  characterType?: string
  connectionId: string
  requestedCredentials: CredentialRequest[]
  entityName: string
}

export const StepProof: React.FC<Props> = ({
  proof,
  step,
  connectionId,
  requestedCredentials,
  entityName,
  characterType,
}) => {
  const dispatch = useAppDispatch()
  const proofReceived =
    (proof?.state as string) === 'presentation_received' ||
    (proof?.state as string) === 'verified' ||
    proof?.state === 'done'

  const [isFailedRequestModalOpen, setIsFailedRequestModalOpen] = useState(false)
  const showFailedRequestModal = () => setIsFailedRequestModalOpen(true)
  const closeFailedRequestModal = () => setIsFailedRequestModalOpen(false)

  const { isDeepLink } = useConnection()
  const { message } = useSocket()

  /**
   * Resolves a template marker stored in showcase config to a concrete number at request time.
   *
   * Supported markers:
   *   `$now`          → current Unix timestamp in seconds (for nonRevoked windows)
   *   `$dateint:N`    → today's date shifted by N years, formatted as YYYYMMDD integer
   *                     (e.g. `$dateint:0` = today, `$dateint:-19` = 19 years ago)
   *
   * Plain numbers pass through unchanged. Unrecognised strings return undefined.
   */
  const resolveMarker = (val: string | number | undefined): number | undefined => {
    if (typeof val !== 'string') return val as number | undefined
    if (val === '$now') return Math.floor(Date.now() / 1000)
    const m = val.match(/^\$dateint:(-?\d+)$/)
    if (m) {
      const d = new Date()
      d.setFullYear(d.getFullYear() + parseInt(m[1]))
      return parseInt(d.toISOString().split('T')[0].replace(/-/g, ''))
    }
    return undefined
  }

  const resolveNonRevoked = (
    nr: { to: number | string; from?: number | string } | undefined,
  ): { to: number; from?: number } | undefined => {
    if (!nr) return undefined
    return { to: resolveMarker(nr.to) as number, from: resolveMarker(nr.from) }
  }

  const createProofRequest = () => {
    const proofs: Record<string, ProofAttributeRequest> = {}

    const predicates: Record<string, ProofPredicateRequest> = {}

    requestedCredentials?.forEach((item) => {
      const restrictions: ProofRestriction[] = [
        {
          schema_name: item.name,
        },
      ]
      if (item.schema_id) {
        restrictions.push({
          schema_id: item.schema_id,
        })
      }
      if (item.cred_def_id) {
        restrictions.push({
          cred_def_id: item.cred_def_id,
        })
      }
      if (item.properties) {
        proofs[item.name] = {
          restrictions,
          names: item.properties,
          non_revoked: resolveNonRevoked(item.nonRevoked),
        }
      }
      if (item.predicates) {
        item.predicates.forEach((predicate) => {
          predicates[`${item.name}_${predicate.name}`] = {
            restrictions,
            name: predicate.name,
            p_value: resolveMarker(predicate.value),
            p_type: predicate.type,
            non_revoked: resolveNonRevoked(item.nonRevoked),
          }
        })
      }
    })
    if (isDeepLink) {
      dispatch(
        createDeepProof({
          connectionId: connectionId,
          attributes: proofs,
          predicates: predicates,
          requestOptions: { name: step.requestOptions?.name, comment: step.requestOptions?.text },
        }),
      )
    } else {
      dispatch(
        createProof({
          connectionId: connectionId,
          attributes: proofs,
          predicates: predicates,
          requestOptions: { name: step.requestOptions?.name, comment: step.requestOptions?.text },
        }),
      )
    }
  }

  useEffect(() => {
    if (!proof) {
      createProofRequest()
    }
    return () => {
      dispatch({ type: 'clearProof' })
    }
  }, [])

  useEffect(() => {
    if (!message || !message.endpoint || !message.state) {
      return
    }
    const { endpoint, state } = message
    if (endpoint === 'present_proof' && (state === 'presentation_received' || state === 'verified')) {
      dispatch(fetchProofById(message.presentation_exchange_id))
    }
  }, [message])

  // remove proof record after we're done with it
  useEffect(() => {
    if (proofReceived) {
      dispatch(deleteProofById(proof?.id))
    }
  }, [proofReceived])

  const sendNewRequest = () => {
    if (!proofReceived && proof) {
      dispatch(deleteProofById(proof?.id))
      createProofRequest()
    }
    closeFailedRequestModal()
  }

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.name} description={step.text} />
      <div className="flex flex-row m-auto w-full">
        <div className="w-full lg:w-2/3 sxl:w-2/3 m-auto">
          {proof && (
            <ProofAttributesCard
              entityName={entityName}
              requestedCredentials={requestedCredentials}
              proof={proof}
              proofReceived={proofReceived}
            />
          )}
        </div>
      </div>
      <ActionCTA
        isCompleted={proofReceived}
        onFail={() => {
          trackSelfDescribingEvent({
            event: {
              schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
              data: {
                action: 'cred_not_received',
                path: characterType,
                step: step.name,
              },
            },
          })
          showFailedRequestModal()
        }}
      />
      {isFailedRequestModalOpen && (
        <FailedRequestModal
          key="credentialModal"
          action={sendNewRequest}
          close={closeFailedRequestModal}
          proof={true}
        />
      )}
    </motion.div>
  )
}
