import type { ConnectionState } from '../../../slices/connection/connectionSlice'
import type { UseCaseScreen } from '../../../slices/types'

import { motion } from 'framer-motion'
import React, { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'

import { fade, fadeX } from '../../../FramerAnimations'
import { QRCode } from '../../../components/QRCode'
import { useAppDispatch } from '../../../hooks/hooks'
import { setConnection, setDeepLink } from '../../../slices/connection/connectionSlice'
import { createInvitation } from '../../../slices/connection/connectionThunks'
import { useSocket } from '../../../slices/socket/socketSelector'
import { nextStep } from '../../../slices/useCases/useCasesSlice'
import { isConnected } from '../../../utils/Helpers'
import { prependApiUrl } from '../../../utils/Url'
import { StepInfo } from '../components/StepInfo'

export interface Props {
  step: UseCaseScreen
  connection: ConnectionState
  newConnection?: boolean
}

export const StepConnection: React.FC<Props> = ({ step, connection, newConnection }) => {
  const dispatch = useAppDispatch()
  const { state, invitationUrl } = connection
  const { message } = useSocket()
  const isCompleted = isConnected(state as string)
  const deepLink = `bcwallet://aries_connection_invitation?${invitationUrl?.split('?')[1]}`

  useEffect(() => {
    if (!isCompleted || newConnection)
      dispatch(createInvitation({ issuer: step.verifier?.name ?? 'Unknown', goalCode: 'aries.vc.verify.once' }))
  }, [])

  useEffect(() => {
    if (!message || !message.endpoint || !message.state) {
      return
    }
    const { endpoint, state } = message
    if (endpoint === 'connections' && state === 'active') {
      dispatch(setConnection(message))
    }
  }, [message])

  const handleDeepLink = () => {
    if (connection.id) {
      dispatch(setDeepLink())
      dispatch(nextStep())
      setTimeout(() => {
        window.location.href = deepLink
      }, 500)
    }
  }

  const renderQRCode = (overlay?: boolean) => {
    return invitationUrl ? <QRCode invitationUrl={invitationUrl} connectionState={state} overlay={overlay} /> : null
  }

  const renderCTA = !isCompleted ? (
    <motion.div variants={fade} key="openWallet">
      <p>
        Scan the QR-code with your digital wallet {isMobile && 'or '}
        {isMobile && (
          <a onClick={handleDeepLink} className="underline underline-offset-2 mt-2">
            open in your wallet
            <FiExternalLink className="inline pb-1" />
          </a>
        )}{' '}
        to prove things about yourself
      </p>
    </motion.div>
  ) : (
    <motion.div variants={fade} key="ctaCompleted">
      <p>Success! You can continue.</p>
    </motion.div>
  )

  return (
    <motion.div variants={fadeX} initial="hidden" animate="show" exit="exit" className="flex flex-col h-full">
      <StepInfo title={step.title} description={step.text} />
      {step.image && !isMobile ? (
        <div
          className="bg-contain bg-center bg-no-repeat h-full flex justify-end"
          title={step.title}
          style={{ backgroundImage: `url(${prependApiUrl(step.image)})` }}
        >
          <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4 mr-8 shadow-lg dark:text-black">
            {/* {step?.overlay?.header && <p className="w-3/4 text-center font-semibold mb-2">{step.overlay.header}</p>} */}
            {renderQRCode(true)}
            {/* {step?.overlay?.footer && <p className="w-3/4 text-center mt-2">{step.overlay.footer}</p>} */}
          </div>
        </div>
      ) : (
        <>
          {renderQRCode()}
          <div className="flex flex-col my-4 text-center font-semibold">{renderCTA}</div>
        </>
      )}
    </motion.div>
  )
}
