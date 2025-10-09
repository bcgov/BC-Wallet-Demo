import React, { useEffect, useRef, useState } from 'react'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import { AnimatePresence, motion } from 'framer-motion'

import { ActionCTA } from '../../../../components/ActionCTA'
import { useAppDispatch } from '../../../../hooks/hooks'
import { useConnection } from '../../../../slices/connection/connectionSelectors'
import { createDeepProof, createProof, deleteProofById, fetchProofById } from '../../../../slices/proof/proofThunks'
import { useSocket } from '../../../../slices/socket/socketSelector'
import type { CredentialRequest } from '../../../../slices/types'
import { FailedRequestModal } from '../../../onboarding/components/FailedRequestModal'
import { ProofAttributesCard } from '../../components/ProofAttributesCard'
import { dropIn, standardFade } from '../../../../FramerAnimations'
import { SmallButton } from '../../../../components/SmallButton'
import { dropIn, standardFade } from '../../../../FramerAnimations'
import { SmallButton } from '../../../../components/SmallButton'

export interface Props {
  proof?: any
  title: string
  characterType?: string
  connectionId: string
  requestedCredentials: CredentialRequest[]
  entityName: string
  requestOptions: { title: string; text: string }
}

export const PresentCredentialAction: React.FC<Props> = ({
  proof,
  title,
  connectionId,
  requestedCredentials,
  entityName,
  characterType,
  requestOptions,
}) => {
  const dispatch = useAppDispatch()
  const proofReceived =
    (proof?.state as string) === 'presentation_received' ||
    (proof?.state as string) === 'verified' ||
    proof?.state === 'done'

  const [isFailedRequestModalOpen, setIsFailedRequestModalOpen] = useState(false)
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false)
  const showFailedRequestModal = () => setIsFailedRequestModalOpen(true)
  const closeFailedRequestModal = () => setIsFailedRequestModalOpen(false)
  const proofRequestCreated = useRef(false);

  const { isDeepLink } = useConnection()
  const { message } = useSocket()

  const createProofRequest = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proofs: any = {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predicates: any = {}

    requestedCredentials?.forEach((item) => {
      const restrictions: any[] = [
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
          non_revoked: item.nonRevoked,
        }
      }
      if (item.predicates) {
        item.predicates.forEach((p) => {
          predicates[p.name] = {
            restrictions,
            name: p.name,
            p_value: p.value,
            p_type: p.type,
            non_revoked: item.nonRevoked,
          }
          return predicates[p.name]
        })
      }
    })
    if (isDeepLink) {
      dispatch(
        createDeepProof({
          connectionId: connectionId,
          attributes: proofs,
          predicates: predicates,
          requestOptions: { name: requestOptions.title, comment: requestOptions.text },
        })
      )
    } else {
      dispatch(
        createProof({
          connectionId: connectionId,
          attributes: proofs,
          predicates: predicates,
          requestOptions: { name: requestOptions.title, comment: requestOptions.text },
        })
      )
    }
  }

  useEffect(() => {
    if (!proof && !proofRequestCreated.current) {
      createProofRequest()
      proofRequestCreated.current = true
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
    if (
      endpoint === 'present_proof' &&
      (state === 'presentation_received' || state === 'verified' || state === 'done')
    ) {
      dispatch(fetchProofById(message.presentation_exchange_id))
    }
    if(message.state === 'abandoned') {
      setIsDeclineModalOpen(true)
    }
  }, [message])

  const sendNewRequest = () => {
    if (!proofReceived && proof) {
      dispatch(deleteProofById(proof.id))
      createProofRequest()
    }
    proofRequestCreated.current = true
    closeFailedRequestModal()
    setIsDeclineModalOpen(false)
  }

  if(proof){  
    console.log('Received Proof:', proof)
  }

  console.log('Received Proof:', proof)

  return (
    <motion.div>
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
                step: title,
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
      {isDeclineModalOpen && (
        <AnimatePresence>
          <motion.div
            variants={standardFade}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed z-10 inset-0 overflow-y-auto"
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-bcgov-black bg-opacity-50 transition-all duration-300"
                aria-hidden="true"
                onClick={close}
              />

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true" />

              <motion.div
                variants={dropIn}
                initial="hidden"
                animate="show"
                exit="exit"
                className="bg-bcgov-white dark:bg-bcgov-black inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all duration-300 sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:text-white"
              >
                <div className=" px-4 pt-2 mt-4 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h2 className="text-xl font-medium text-grey-900">{'Proof request declined'}</h2>
                      <div className="mt-2">
                        <p className="text-sm">
                          User has declined the proof request{' '}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4 sm:px-6 flex flex-row-reverse">
                  <SmallButton onClick={() => setIsDeclineModalOpen(false)} text={'OK'} disabled={false} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}
