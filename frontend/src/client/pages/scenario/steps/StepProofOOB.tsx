import type {
  CredentialRequest,
  ProofAttributeRequest,
  ProofPredicateRequest,
  ProofRestriction,
  ScenarioScreen,
} from '../../../slices/types'

import { motion } from 'framer-motion'
import React, { useEffect, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'

import { fade, fadeX } from '../../../FramerAnimations'
import { QRCode } from '../../../components/QRCode'
import { useAppDispatch } from '../../../hooks/hooks'
import { prependApiUrl } from '../../../utils/Url'
import { useProof } from '../../../slices/proof/proofSelectors'
import { createProofOOB, deleteProofById, fetchProofById } from '../../../slices/proof/proofThunks'
import { useSocket } from '../../../slices/socket/socketSelector'
import log from '../../../utils/logger'
import { ProofAttributesCard } from '../components/ProofAttributesCard'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  proof?: any
  step: ScenarioScreen
  requestedCredentials: CredentialRequest[]
  entityName: string
}

const resolveMarker = (val: string | number | undefined): number | undefined => {
  if (typeof val !== 'string') return val as number | undefined
  if (val === '$now') return Math.floor(Date.now() / 1000)
  const m = val.match(/^\$dateint:(-?\d+)$/)
  if (m) {
    const d = new Date()
    d.setFullYear(d.getFullYear() + parseInt(m[1]))
    return parseInt(d.toISOString().split('T')[0].replace(/-/g, ''))
  }
  log.warn(`resolveMarker: unrecognised marker "${val}", proof request may be malformed`)
  return undefined
}

const resolveNonRevoked = (
  nr: { to: number | string; from?: number | string } | undefined,
): { to: number; from?: number } | undefined => {
  if (!nr) return undefined
  const to = resolveMarker(nr.to)
  if (to === undefined) return undefined
  return { to, from: resolveMarker(nr.from) }
}

export const StepProofOOB: React.FC<Props> = ({ proof, step, requestedCredentials, entityName }) => {
  const dispatch = useAppDispatch()
  const proofRequestCreatedRef = useRef(false)
  const { shortProofUrl, proofUrl } = useProof()
  const { message } = useSocket()

  const proofDone = (proof?.state as string) === 'verified' || proof?.state === 'done'
  const proofReceived = proofDone && proof?.verified !== 'false'
  const proofFailed = proofDone && proof?.verified === 'false'

  const deepLink = proofUrl ? `bcwallet://aries_connection_invitation?${proofUrl.split('?')[1]}` : ''

  useEffect(() => {
    if (!proofRequestCreatedRef.current && !proof) {
      proofRequestCreatedRef.current = true
      const proofs: Record<string, ProofAttributeRequest> = {}
      const predicates: Record<string, ProofPredicateRequest> = {}

      requestedCredentials?.forEach((item) => {
        const restriction: ProofRestriction = { schema_name: item.name }
        if (item.schema_id) restriction.schema_id = item.schema_id
        if (item.cred_def_id) restriction.cred_def_id = item.cred_def_id
        const restrictions: ProofRestriction[] = [restriction]
        if (item.properties?.length) {
          proofs[item.name] = {
            restrictions,
            names: item.properties,
            non_revoked: resolveNonRevoked(item.nonRevoked),
          }
        }
        if (item.predicates?.length) {
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

      dispatch(
        createProofOOB({
          connectionId: '',
          attributes: proofs,
          predicates,
          requestOptions: { name: step.requestOptions?.name, comment: step.requestOptions?.text },
        }),
      )
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
    if (endpoint === 'present_proof_v2_0' && (state === 'presentation-received' || state === 'done')) {
      dispatch(fetchProofById(message.pres_ex_id))
    }
  }, [message])

  useEffect(() => {
    if (proofReceived && proof?.id) {
      dispatch(deleteProofById(proof.id))
    }
  }, [proofReceived])

  useEffect(() => {
    if (proofFailed && proof?.id) {
      dispatch(deleteProofById(proof.id))
    }
  }, [proofFailed])

  const qrUrl = shortProofUrl ?? proofUrl
  const qrImage = step.verifier?.icon ? prependApiUrl(step.verifier.icon) : undefined

  const renderQRCode = (overlay?: boolean) => {
    return qrUrl ? (
      <QRCode invitationUrl={qrUrl} connectionState={proof?.state} overlay={overlay} image={qrImage} />
    ) : null
  }

  const renderCTA = proofFailed ? (
    <motion.div variants={fade} key="proofFailed">
      <p className="text-red-600">Verification failed. The credential may have been revoked.</p>
    </motion.div>
  ) : proofReceived ? (
    <motion.div variants={fade} key="proofCompleted">
      <p>Success! You can continue.</p>
    </motion.div>
  ) : (
    <motion.div variants={fade} key="scanProofQr">
      <p>
        Scan the QR code with your digital wallet {isMobile && proofUrl && 'or '}
        {isMobile && proofUrl && (
          <a href={deepLink} className="underline underline-offset-2 mt-2">
            open in your wallet
            <FiExternalLink className="inline pb-1" />
          </a>
        )}{' '}
        to present the requested credentials.
      </p>
    </motion.div>
  )

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.name} description={step.text} />
      <motion.div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4 dark:text-black">
        {renderQRCode(true)}
      </motion.div>
      {proof && (
        <motion.div className="flex flex-row m-auto w-full mt-4">
          <div className="w-full lg:w-2/3 m-auto">
            <ProofAttributesCard
              entityName={entityName}
              requestedCredentials={requestedCredentials}
              proof={proof}
              proofReceived={proofReceived}
            />
          </div>
        </motion.div>
      )}
      <motion.div className="flex flex-col mt-4 text-center text-sm md:text-base font-semibold">{renderCTA}</motion.div>
    </motion.div>
  )
}
