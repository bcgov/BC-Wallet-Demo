import type { ReactElement } from 'react'
import React from 'react'
import { StepActionType } from 'bc-wallet-openapi'

import { motion } from 'framer-motion'

import { fadeX } from '../../../FramerAnimations'
import type { Credential, StepAction, TextWithImage } from '../../../slices/types'
import { StepInformation } from '../components/StepInformation'
import { SetupConnectionAction } from './actions/SetupConnectionAction'
import { ChooseWalletAction } from './actions/ChooseWalletAction'
import { AcceptCredentialAction } from './actions/AcceptCredentialAction'

export interface Props {
  title: string
  text: string
  textWithImage?: TextWithImage[]
  actions?: StepAction[]
  nextStep?: () => Promise<void>
  invitationUrl?: string
  connectionState?: string
  connectionId?: string
  issuerName?: string
  credentials?: Credential[]
}

export const StepView: React.FC<Props> = (props: Props): ReactElement => {
  const {
    title,
    text,
    textWithImage,
    actions = [],
    nextStep,
    invitationUrl,
    connectionState,
    connectionId,
    issuerName,
    credentials = [],
  } = props

  const getActionElements = () => {
    return actions.map((action, index) => {
      switch (action.actionType) {
        case StepActionType.SetupConnection:
          return <SetupConnectionAction
              key={index}
              connectionId={connectionId}
              nextStep={nextStep}
              invitationUrl={invitationUrl}
              issuerName={issuerName ?? 'Unknown'}
              newConnection
              disableSkipConnection={false}
              connectionState={connectionState}
              //backgroundImage={} // FIXME we need to support a background image
            />
        case StepActionType.ChooseWallet:
          return <ChooseWalletAction key={index} nextStep={nextStep} />
        case StepActionType.AcceptCredential:
          return <AcceptCredentialAction key={index} connectionId={connectionId ?? ''} credentials={credentials} />
        default:
          return <div />
      }
    })
  }

  return (
    <motion.div className="h-full" variants={fadeX} initial="hidden" animate="show" exit="exit">
      <StepInformation title={title} text={text} textWithImage={textWithImage} />
      {getActionElements()}
    </motion.div>
  )
}
