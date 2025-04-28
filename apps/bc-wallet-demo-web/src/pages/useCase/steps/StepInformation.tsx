import React, { FC } from 'react'
import { motion } from 'framer-motion'
import { fadeX } from '../../../FramerAnimations'
import { StepInfo } from '../components/StepInfo'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import { StepActionType} from 'bc-wallet-openapi'
import { SetupConnectionAction } from './actions/SetupConnectionAction'
import { ConnectionState } from '../../../slices/connection/connectionSlice'
import { PresentCredentialAction } from './actions/PresentCredentialAction'
import type {
    AriesOOBStepAction,
    StepAction,
    Persona,
    RelyingParty
} from '../../../slices/types'

export interface Props {
  title: string
  description: string
  asset?: string
  connection?: ConnectionState
  verifier?: RelyingParty
  actions?: StepAction[]
  proof?: any
  currentPersona: Persona
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
      currentPersona
  } = props

  const getActionElements = () => {
      return actions.map((action, index) => {
          switch (action.actionType) {
              case StepActionType.SetupConnection: {
                  if (!connection) {
                      throw new Error('A connection is required for a setup connection action')
                  }
                  return <SetupConnectionAction
                      newConnection={true}
                      verifierName={verifier?.name ?? 'UNKNOWN'}
                      connection={connection}
                      title={title}
                      image={asset}
                  />
              }
              case StepActionType.AriesOob: {
                  if (!connection?.id) {
                      throw new Error('A connection id is required for a present credential action')
                  }
                  return <PresentCredentialAction
                      title={title}
                      entityName={verifier?.name ?? 'UNKNOWN'}
                      characterType={currentPersona.role.toLowerCase()}
                      proof={proof}
                      connectionId={connection.id}
                      requestedCredentials={(action as AriesOOBStepAction).credentialDefinitions.map(credentialDefinition => ({
                          name: credentialDefinition.name,
                          icon: credentialDefinition.icon,
                          schema_id: credentialDefinition.schema.identifier,
                          properties: credentialDefinition.proofRequest?.attributes?.[credentialDefinition.schema.name].attributes,
                          predicates: credentialDefinition.proofRequest?.predicates?.[credentialDefinition.schema.name]
                      }))}
                      requestOptions={{
                          title: action.title,
                          text: action.text
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
