import { track } from 'insights-js'
import { QRCodeSVG } from 'qrcode.react'
import React, { useEffect } from 'react'

import { isConnected } from '../utils/Helpers'

import { CheckMark } from './Checkmark'

export interface Props {
  invitationUrl: string
  connectionState?: string
  overlay?: boolean
}

export const QRCode: React.FC<Props> = ({ invitationUrl, connectionState, overlay }) => {
  const isCompleted = isConnected(connectionState as string)

  useEffect(() => {
    if (isCompleted) {
      track({
        id: 'connection-completed',
      })
    }
  }, [isCompleted])

  const renderQRCode = invitationUrl && (
    <div className={`relative w-fit rounded-lg bg-white p-3 ${overlay ? 'm-auto' : 'm-auto shadow-lg'}`}>
      <QRCodeSVG value={invitationUrl} size={165} bgColor="#FFFFFF" fgColor="#000000" includeMargin />
      {isCompleted && (
        <div className="absolute inset-0 flex justify-center items-center bg-grey bg-opacity-60 rounded-lg">
          <CheckMark height="64" colorCircle="grey" />
        </div>
      )}
    </div>
  )

  return <div>{renderQRCode}</div>
}
