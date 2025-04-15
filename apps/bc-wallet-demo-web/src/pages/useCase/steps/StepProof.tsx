import React, {useEffect, useRef, useState} from 'react'
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import { ActionCTA } from '../../../components/ActionCTA'
import { useAppDispatch } from '../../../hooks/hooks'
import { useConnection } from '../../../slices/connection/connectionSelectors'
import { createDeepProof, createProof, deleteProofById, fetchProofById } from '../../../slices/proof/proofThunks'
import { useSocket } from '../../../slices/socket/socketSelector'
import { FailedRequestModal } from '../../onboarding/components/FailedRequestModal'
import { ProofAttributesCard } from '../components/ProofAttributesCard'
import type { CredentialRequest } from '../../../slices/types'

export interface Props {
  proof?: any
  title: string
  characterType?: string
  connectionId: string
  requestedCredentials: CredentialRequest[]
  entityName: string
  requestOptions: { title: string, text: string } // TODO interface
}

export const StepProof: React.FC<Props> = ({
  proof,
  title,
  connectionId,
  requestedCredentials,
  entityName,
  characterType,
  requestOptions
}) => {
  const dispatch = useAppDispatch()
  const proofReceived =
    (proof?.state as string) === 'presentation_received' ||
    (proof?.state as string) === 'verified' ||
    proof?.state === 'done'

  const [isFailedRequestModalOpen, setIsFailedRequestModalOpen] = useState(false)
  const showFailedRequestModal = () => setIsFailedRequestModalOpen(true)
  const closeFailedRequestModal = () => setIsFailedRequestModalOpen(false)
  const proofRequestCreated = useRef(false);

  const { isDeepLink } = useConnection()
  const { message } = useSocket()

  const createProofRequest = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proofs: any = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const predicates: any = []

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
        predicates[item.name] = {
          restrictions,
          name: item.predicates?.name,
          p_value: item.predicates?.value,
          p_type: item.predicates?.type,
          non_revoked: item.nonRevoked,
        }
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
  }, [message])

  // remove proof record after we're done with it
  useEffect(() => {
    if (proofReceived) {
      dispatch(deleteProofById(proof?.id))
    }
  }, [proofReceived])

  const sendNewRequest = () => {
    if (!proofReceived && proof) {
      dispatch(deleteProofById(proof.id))
      createProofRequest()
    }
    proofRequestCreated.current = true
    closeFailedRequestModal()
  }

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
      </motion.div>
  )

  // return (
  //   <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
  //     <StepInfo title={step.title} description={step.text} />
  //     <div className="flex flex-row m-auto w-full">
  //       <div className="w-full lg:w-2/3 sxl:w-2/3 m-auto">
  //         {proof && (
  //           <ProofAttributesCard
  //             entityName={entityName}
  //             requestedCredentials={requestedCredentials}
  //             proof={proof}
  //             proofReceived={proofReceived}
  //           />
  //         )}
  //       </div>
  //     </div>
  //     <ActionCTA
  //       isCompleted={proofReceived}
  //       onFail={() => {
  //         trackSelfDescribingEvent({
  //           event: {
  //             schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
  //             data: {
  //               action: 'cred_not_received',
  //               path: characterType,
  //               step: step.title,
  //             },
  //           },
  //         })
  //         showFailedRequestModal()
  //       }}
  //     />
  //     {isFailedRequestModalOpen && (
  //       <FailedRequestModal
  //         key="credentialModal"
  //         action={sendNewRequest}
  //         close={closeFailedRequestModal}
  //         proof={true}
  //       />
  //     )}
  //   </motion.div>
  // )
}
