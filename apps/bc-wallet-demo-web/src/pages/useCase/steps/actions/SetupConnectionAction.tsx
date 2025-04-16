import React, { FC, useEffect } from 'react'
import { isMobile } from 'react-device-detect'
import { FiExternalLink } from 'react-icons/fi'
import { motion } from 'framer-motion'
import { QRCode } from '../../../../components/QRCode'
import { fade } from '../../../../FramerAnimations'
import { useAppDispatch } from '../../../../hooks/hooks'
import { setConnection, setDeepLink } from '../../../../slices/connection/connectionSlice'
import { createInvitation } from '../../../../slices/connection/connectionThunks'
import { useSocket } from '../../../../slices/socket/socketSelector'
import { nextStep } from '../../../../slices/useCases/useCasesSlice'
import { isConnected } from '../../../../utils/Helpers'
import { showcaseServerBaseUrl } from '../../../../api/BaseUrl'
import type { ConnectionState } from '../../../../slices/connection/connectionSlice'

export interface Props {
  verifierName: string
  connection: ConnectionState
  newConnection?: boolean
  image?: string
  title: string
}

export const SetupConnectionAction: FC<Props> = (props: Props) => {
  const {
    connection,
    newConnection,
    verifierName,
    image,
    title
  } = props
  const dispatch = useAppDispatch()
  const { state, invitationUrl } = connection
  const { message } = useSocket()
  const isCompleted = isConnected(state as string)
  const deepLink = `bcwallet://aries_connection_invitation?${invitationUrl?.split('?')[1]}`

  useEffect(() => {
    if (!isCompleted || newConnection) {
      dispatch(createInvitation({ entity: verifierName, goalCode: 'request-proof', goal: 'Verify credential' }))
    }
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
      image && !isMobile ? (
          <div
              className="bg-contain bg-center bg-no-repeat h-full flex justify-end"
              title={title}
              style={{ backgroundImage: `url(${showcaseServerBaseUrl}/assets/${image}/file)` }}
          >
              <div className="max-w-xs flex flex-col self-center items-center bg-white rounded-lg p-4 mr-8 shadow-lg dark:text-black">
                {renderQRCode(true)}
              </div>
            </div>
        ) : (
            <>
              {renderQRCode()}
              <div className="flex flex-col my-4 text-center font-semibold">{renderCTA}</div>
            </>
      )
  )
}
