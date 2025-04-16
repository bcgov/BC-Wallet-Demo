import React, { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'

import { motion } from 'framer-motion'

import { Button } from '../../../../components/Button'
import { QRCode } from '../../../../components/QRCode'
import { fade } from '../../../../FramerAnimations'
import { useAppDispatch } from '../../../../hooks/hooks'
import { clearConnection, setConnection, setDeepLink } from '../../../../slices/connection/connectionSlice'
import { createInvitation } from '../../../../slices/connection/connectionThunks'
import { clearCredentials } from '../../../../slices/credentials/credentialsSlice'
import { setConnectionDate } from '../../../../slices/preferences/preferencesSlice'
import { useSocket } from '../../../../slices/socket/socketSelector'
import { isConnected } from '../../../../utils/Helpers'

export interface Props {
  connectionId?: string
  nextStep?: () => Promise<void>
  invitationUrl?: string
  connectionState?: string
  newConnection?: boolean
  disableSkipConnection?: boolean
  issuerName: string
  backgroundImage?: string
  onConnectionComplete?: () => void
}

export const SetupConnectionAction: React.FC<Props> = ({
  connectionId,
  nextStep,
  invitationUrl,
  connectionState,
  newConnection,
  issuerName,
  disableSkipConnection,
  backgroundImage,
  onConnectionComplete,
}) => {
  const deepLink = `bcwallet://aries_connection_invitation?${invitationUrl?.split('?')[1]}`
  const dispatch = useAppDispatch()
  const isCompleted = isConnected(connectionState as string)
  const { message } = useSocket()

  useEffect(() => {
    if (!isCompleted || newConnection) {
      dispatch(clearConnection())
      dispatch(createInvitation({ issuer: issuerName, goalCode: 'vc-issue' }))
      dispatch(clearCredentials())
    }
  }, [])

  useEffect(() => {
    if (isCompleted && onConnectionComplete) {
      onConnectionComplete()
    }
  }, [isCompleted])

  useEffect(() => {
    if (connectionId) {
      const date = new Date()
      dispatch(setConnectionDate(date))
    }
  }, [connectionId])

  useEffect(() => {
    if (!message || !message.endpoint || !message.state) {
      return
    }
    const { endpoint, state } = message
    if (endpoint === 'connections' && state === 'active') {
      dispatch(setConnection(message))
    }
  }, [message])

  const renderQRCode = (overlay?: boolean) => {
    return invitationUrl ? (
      <QRCode invitationUrl={invitationUrl} connectionState={connectionState} overlay={overlay} />
    ) : null
  }

  const handleDeepLink = async () => {
    if (connectionId) {
      dispatch(setDeepLink())
      await nextStep?.()
      setTimeout(() => {
        window.location.href = deepLink
      }, 500)
    }
  }
  const renderCTA = !isCompleted ? (
    <motion.div variants={fade} key="openWallet">
      <>
        <p>
          Scan the QR-code with your <a href={deepLink}>wallet {isMobile && 'or'} </a>
        </p>
        {isMobile && (
          <a onClick={handleDeepLink} className="underline underline-offset-2 mt-2">
            open in wallet
            <FiExternalLink className="inline pb-1" />
          </a>
        )}
      </>
      {!disableSkipConnection && (
        <div className="my-5">
          {nextStep && <Button text="I Already Have my Credential" onClick={nextStep}></Button>}
        </div>
      )}
    </motion.div>
  ) : (
    <motion.div variants={fade} key="ctaCompleted">
      <p>Success! You can continue.</p>
    </motion.div>
  )

  return !backgroundImage || isMobile ? (
    <div className="flex flex-col justify-center">
      <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4 dark:text-black">
        {renderQRCode(true)}
      </div>
      <div className="flex flex-col mt-4 text-center text-sm md:text-base font-semibold">{renderCTA}</div>
    </div>
  ) : (
    <div
      className="bg-contain position-relative bg-center bg-no-repeat flex justify-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4 dark:text-black">
        <p className="text-center mb-2">Scan the QR Code below with your digital wallet.</p>
        <div>{renderQRCode(true)}</div>
        <div className="mt-5">
          {nextStep && <Button text="I Already Have my Credential" onClick={nextStep}></Button>}
        </div>
      </div>
    </div>
  )
}
