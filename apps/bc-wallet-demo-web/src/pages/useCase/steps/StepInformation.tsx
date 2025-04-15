import React, { FC } from 'react'
import { motion } from 'framer-motion'
import { fadeX } from '../../../FramerAnimations'
import { StepInfo } from '../components/StepInfo'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import { StepAction } from '../../../slices/types'
import { StepActionType} from 'bc-wallet-openapi'
import { StepConnection } from './StepConnection'
import { ConnectionState } from '../../../slices/connection/connectionSlice'
import { StepProof } from './StepProof'
import type { CredentialDefinition, Persona, RelyingParty } from '../../../slices/types'

export interface Props {
  title: string
  description: string
  asset?: string
  connection?: ConnectionState
  verifier?: RelyingParty
  actions?: StepAction[]
  proof?: any
  currentPersona: Persona
  requestedCredentials?: CredentialDefinition[]
}

export const StepInformation: FC<Props> = (props: Props) => {
  const {
      asset,
      title,
      description,
      connection,
      verifier,
      actions = [],
      proof,
      currentPersona,
      requestedCredentials = []
  } = props

  const getActionElements = () => {
      return actions.map((action, index) => {
          switch (action.actionType) {
              case StepActionType.SetupConnection: {
                  if (!connection) {
                      throw new Error('A connection is required for a connection action')
                  }

                  console.log(`verifier: ${verifier?.name}`)
                  return <StepConnection
                      newConnection={true}
                      verifierName={verifier?.name ?? 'UNKNOWN'}
                      connection={connection}
                      title={title}
                      image={asset}
                  />
              }
              case StepActionType.AriesOob: {
                  if (!connection?.id) {
                      throw new Error('A connection id is required for a proof action')
                  }
                  return <StepProof
                      title={title}
                      entityName={verifier?.name ?? 'UNKNOWN'}
                      characterType={currentPersona.role.toLowerCase()}
                      proof={proof}
                      connectionId={connection.id}
                      requestedCredentials={[
                          {
                              name: 'anoncred-test-2',
                              //icon?: string
                              schema_id: 'DpmUAZoZyADXmed1NMrJPZ:2:anoncred-test-2:0.2',
                              cred_def_id: 'DpmUAZoZyADXmed1NMrJPZ:3:CL:2751642:default',
                              //predicates: { name: 'scores', value: 1, type: '<=' }, //(action as AriesOOBAction).proofRequest.predicates,//
                              properties: ["scores"], //(action as AriesOOBAction).proofRequest.attributes
                              //nonRevoked?: { to: number; from?: number }
                          }
                      ]}
                      requestOptions={{
                          title: action.title, // TODO
                          text: action.text // TODO
                      }}
                  />
              }
              default:
                  return <div />
          }
      })
  }

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={title} description={description} />
      { asset && !actions.some(action => action.actionType === StepActionType.SetupConnection) &&
          <div className="flex m-auto">
              <img className="object-contain m-auto w-5/6" src={`${showcaseServerBaseUrl}/assets/${asset}/file`} alt={title} />
          </div>
      }
      {getActionElements()}
    </motion.div>
  )
}
