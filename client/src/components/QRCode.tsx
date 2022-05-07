import { track } from 'insights-js'
import React, { useEffect } from 'react'
import { useMediaQuery } from 'react-responsive'

import { CheckMark } from './Checkmark'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const QR = require('qrcode.react')

export interface Props {
  invitationUrl: string
  connectionState?: string
  overlay?: boolean
}

export const QRCode: React.FC<Props> = ({ invitationUrl, connectionState, overlay }) => {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' })
  const isLarge = useMediaQuery({ query: '(max-width: 1242px)' })

  const isCompleted = connectionState === 'responded' || connectionState === 'complete'

  useEffect(() => {
    if (isCompleted) {
      track({
        id: 'connection-completed',
      })
    }
  }, [isCompleted])

  const renderQRCode = invitationUrl && (
    <div className={`relative ${overlay ? 'bg-none' : 'rounded-lg bg-bcgov-lightgrey p-4 m-auto'}`}>
      <QR value={invitationUrl} size={isMobile ? 192 : isLarge ? 212 : 256} />
      {isCompleted && (
        <div className="absolute inset-0 flex justify-center items-center bg-grey bg-opacity-60 rounded-lg">
          <CheckMark height="64" colorCircle="grey" />
        </div>
      )}
    </div>
  )

  return <div className={`${!overlay && 'shadow-lg m-auto'}`}>{renderQRCode}</div>
}
