import React, { FC } from 'react'

import { StepActionType } from 'bc-wallet-openapi'
import { motion } from 'framer-motion'

import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import { fadeX } from '../../../FramerAnimations'
import { ConnectionState } from '../../../slices/connection/connectionSlice'
import type { AriesOOBStepAction, StepAction, Persona, RelyingParty } from '../../../slices/types'
import { StepInfo } from '../components/StepInfo'
import { PresentCredentialAction } from './actions/PresentCredentialAction'
import { SetupConnectionAction } from './actions/SetupConnectionAction'

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
  const { asset, title, description, connection, verifier, actions = [], proof, currentPersona } = props

  const getActionElements = () => {
    return actions.map((action, index) => {
      switch (action.actionType) {
        case StepActionType.SetupConnection: {
          if (!connection) {
            throw new Error('A connection is required for a setup connection action')
          }
          return (
            <SetupConnectionAction
              newConnection={true}
              verifierName={verifier?.name ?? 'UNKNOWN'}
              connection={connection}
              title={title}
              image={asset}
            />
          )
        }
        case StepActionType.AriesOob: {
          //@ts-ignore
                if (!action.credentialDefinitions || action.credentialDefinitions.length === 0) {
              return
          }
          return (
            <PresentCredentialAction
              title={title}
              entityName={verifier?.name ?? 'UNKNOWN'}
              characterType={currentPersona.role.toLowerCase()}
              proof={proof}
              connectionId={connection?.id ?? ''}
              requestedCredentials={((action as AriesOOBStepAction).credentialDefinitions || []).map(
                (credentialDefinition) => ({
                  name: credentialDefinition.name,
                  icon: credentialDefinition.icon,
                  schema_id: credentialDefinition.schema.identifier,
                  properties:
                    credentialDefinition.proofRequest?.attributes?.[credentialDefinition.schema.name].attributes,
                  predicates:
                    credentialDefinition.proofRequest?.predicates?.[credentialDefinition.schema.name].predicates?.[0],
                }),
              )}
              requestOptions={{
                title: action.title,
                text: action.text,
              }}
            />
          )
        }
        default:
          return <div />
      }
    })
  }

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={title} description={description} />
      {asset && !actions.some((action) => action.actionType === StepActionType.SetupConnection) && (
        <div className="flex m-auto">
          <img
            className="object-contain m-auto w-5/6"
            src={`${showcaseServerBaseUrl}/assets/${asset}/file`}
            alt={title}
          />
        </div>
      )}
      {getActionElements()}
    </motion.div>
  )
}
