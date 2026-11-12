import { motion } from 'framer-motion'
import React, { useEffect, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'

import { fade, fadeX } from '../../../FramerAnimations'
import { Button } from '../../../components/Button'
import { QRCode } from '../../../components/QRCode'
import { useAppDispatch } from '../../../hooks/hooks'
import { clearConnection, setConnection, setDeepLink } from '../../../slices/connection/connectionSlice'
import { createInvitation } from '../../../slices/connection/connectionThunks'
import { clearCredentials } from '../../../slices/credentials/credentialsSlice'
import { setIntroductionConnectionId } from '../../../slices/introduction/introductionSlice'
import { setConnectionDate } from '../../../slices/preferences/preferencesSlice'
import { useSocket } from '../../../slices/socket/socketSelector'
import { isConnected } from '../../../utils/Helpers'
import { prependApiUrl } from '../../../utils/Url'
import { StepInformation } from '../components/StepInformation'

export interface Props {
  connectionId?: string
  skipIssuance(): void
  nextSlide(): void
  invitationUrl?: string
  shortInvitationUrl?: string
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
  shortInvitationUrl,
  connectionState,
  newConnection,
  issuerName,
  disableSkipConnection,
  backgroundImage,
  onConnectionComplete,
}) => {
  const deepLink = `bcwallet://aries_connection_invitation?${invitationUrl?.split('?')[1]}`

  const dispatch = useAppDispatch()
  const invitationCreatedRef = useRef(false)

  const isCompleted = isConnected(connectionState as string)

  const { message } = useSocket()

  useEffect(() => {
    if (!invitationCreatedRef.current && (!isCompleted || newConnection)) {
      invitationCreatedRef.current = true
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
      dispatch(setIntroductionConnectionId(connectionId))
      dispatch(setConnectionDate(new Date().toISOString()))
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

  const qrUrl = shortInvitationUrl ?? invitationUrl

  const renderQRCode = (overlay?: boolean) => {
    return qrUrl ? <QRCode invitationUrl={qrUrl} connectionState={connectionState} overlay={overlay} /> : null
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
      className="flex min-h-0 flex-1 flex-col overflow-y-auto dark:text-white"
      variants={fadeX}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="shrink-0">
        <StepInformation title={title} text={text} compact />
      </div>
      <div className="grid min-h-[207px] flex-1 shrink-0 place-items-center">
        <div className="aspect-square w-[207px] rounded-lg border border-bcgov-lightgrey p-2 shadow-sm [&>div]:w-full [&>div>div]:w-full [&_svg]:h-auto [&_svg]:w-full">
          {renderQRCode(true)}
        </div>
      </div>
      <div className="mt-2 flex shrink-0 flex-col text-center text-sm md:text-base font-semibold">{renderCTA}</div>
    </motion.div>
  ) : (
    <motion.div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto dark:text-white"
      variants={fadeX}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="shrink-0">
        <StepInformation title={title} text={text} compact />
      </div>
      <div className="grid min-h-min flex-1 shrink-0 grid-cols-2 grid-rows-[minmax(min-content,1fr)] items-center gap-4 py-2">
        <img
          className="mx-auto h-full max-h-64 w-full min-w-0 object-contain"
          src={prependApiUrl(backgroundImage)}
          alt=""
        />
        <div className="flex h-full min-h-0 w-full max-w-xs flex-col items-center justify-self-center text-center">
          <p className="mb-2 shrink-0 text-sm font-medium leading-relaxed text-bcgov-darkgrey dark:text-bcgov-lightgrey">
            Scan the QR Code below with your digital wallet.
          </p>
          <div className="grid min-h-[207px] w-full flex-1 shrink-0 place-items-center">
            <div className="aspect-square w-[207px] rounded-lg border border-bcgov-lightgrey p-2 shadow-sm [&>div]:w-full [&>div>div]:w-full [&_svg]:h-auto [&_svg]:w-full">
              {renderQRCode(true)}
            </div>
          </div>
          <div className="mt-2 w-full shrink-0">
            <Button text="I Already Have my Credential" onClick={skipIssuance}></Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
