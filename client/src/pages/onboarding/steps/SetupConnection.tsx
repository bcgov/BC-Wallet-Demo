import { motion } from 'framer-motion'
import React, { useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'
import { io } from 'socket.io-client'

import { fade, fadeX } from '../../../FramerAnimations'
import { baseWsUrl } from '../../../api/BaseUrl'
import { Button } from '../../../components/Button'
import { QRCode } from '../../../components/QRCode'
import { useAppDispatch } from '../../../hooks/hooks'
import { clearConnection, setDeepLink } from '../../../slices/connection/connectionSlice'
import { createInvitation, fetchConnectionById } from '../../../slices/connection/connectionThunks'
import { clearCredentials } from '../../../slices/credentials/credentialsSlice'
import { setOnboardingConnectionId } from '../../../slices/onboarding/onboardingSlice'
import { setConnectionDate } from '../../../slices/preferences/preferencesSlice'
import { isConnected } from '../../../utils/Helpers'
import { prependApiUrl } from '../../../utils/Url'
import { StepInformation } from '../components/StepInformation'

export interface Props {
  connectionId?: string
  skipIssuance(): void
  nextSlide(): void
  invitationUrl?: string
  connectionState?: string
  newConnection?: boolean
  disableSkipConnection?: boolean
  issuerName: string
  title: string
  text: string
  backgroundImage?: string
  onConnectionComplete?: () => void
}

export const SetupConnection: React.FC<Props> = ({
  connectionId,
  skipIssuance,
  nextSlide,
  title,
  text,
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

  useEffect(() => {
    if (!isCompleted || newConnection) {
      dispatch(clearConnection())
      dispatch(createInvitation({ issuer: issuerName, goalCode: 'aries.vc.issue' }))
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
      dispatch(setOnboardingConnectionId(connectionId))
      const date = new Date()
      dispatch(setConnectionDate(date))
    }
  }, [connectionId])

  useEffect(() => {
    const ws = io(baseWsUrl)
    ws.on('connect', () => {
      ws.emit('subscribe', { connectionId: connectionId })
    })

    ws.on('connections', ({ state }) => {
      if (state === 'active') {
        dispatch(fetchConnectionById(connectionId as string))
      }
    })
  }, [connectionId])

  const renderQRCode = (overlay?: boolean) => {
    return invitationUrl ? (
      <QRCode invitationUrl={invitationUrl} connectionState={connectionState} overlay={overlay} />
    ) : null
  }

  const handleDeepLink = () => {
    if (connectionId) {
      dispatch(setDeepLink())
      nextSlide()
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
          <Button text="I Already Have my Credential" onClick={skipIssuance}></Button>
        </div>
      )}
    </motion.div>
  ) : (
    <motion.div variants={fade} key="ctaCompleted">
      <p>Success! You can continue.</p>
    </motion.div>
  )

  return !backgroundImage || isMobile ? (
    <motion.div
      className="flex flex-col h-full  dark:text-white"
      variants={fadeX}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <StepInformation title={title} text={text} />
      <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4  dark:text-black">
        {renderQRCode(true)}
      </div>
      <div className="flex flex-col mt-4 text-center text-sm md:text-base font-semibold">{renderCTA}</div>
    </motion.div>
  ) : (
    <motion.div
      className="flex flex-col h-full  dark:text-white"
      variants={fadeX}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <StepInformation title={title} text={text} />
      <div
        className="bg-contain position-relative bg-center bg-no-repeat h-full flex justify-center"
        style={{ backgroundImage: `url(${prependApiUrl(backgroundImage as string)})` }}
      >
        <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4  dark:text-black">
          <p className="text-center mb-2">Scan the QR Code below with your digital wallet.</p>
          <div>{renderQRCode(true)}</div>
          <div className="mt-5">
            <Button text="I Already Have my Credential" onClick={skipIssuance}></Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
