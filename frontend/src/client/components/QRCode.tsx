import { CustomQRCode } from 'custom-qr-code/react'
import { track } from 'insights-js'
import React, { useEffect } from 'react'

import { isConnected } from '../utils/Helpers'

import { CheckMark } from './Checkmark'

export interface Props {
  invitationUrl: string
  connectionState?: string
  overlay?: boolean
  image?: string
}

export const QRCode: React.FC<Props> = ({ invitationUrl, connectionState, overlay, image }) => {
  const isCompleted = isConnected(connectionState as string)

  useEffect(() => {
    if (isCompleted) {
      track({
        id: 'connection-completed',
      })
    }
  }, [isCompleted])

  const renderQRCode = invitationUrl && (
    <div className={`relative ${overlay ? 'bg-none' : 'rounded-lg bg-bcgov-lightgrey p-4 m-auto'}`}>
      <CustomQRCode
        data={invitationUrl}
        width={165}
        height={165}
        type="svg"
        image={image}
        imageOptions={{
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 4,
        }}
        dotsOptions={{
          type: 'dots',
          gradient: {
            type: 'linear',
            rotation: Math.PI / 4,
            colorStops: [
              { offset: 0, color: '#003366' },
              { offset: 1, color: '#FCBA19' },
            ],
          },
        }}
        cornersSquareOptions={{
          type: 'extra-rounded',
          color: '#003366',
        }}
        cornersDotOptions={{
          type: 'dot',
          color: '#003366',
        }}
        backgroundOptions={{
          color: 'transparent',
        }}
        qrOptions={{
          errorCorrectionLevel: 'H',
        }}
      />
      {isCompleted && (
        <div className="absolute inset-0 flex justify-center items-center bg-grey bg-opacity-60 rounded-lg">
          <CheckMark height="64" colorCircle="grey" />
        </div>
      )}
    </div>
  )

  return <div className={`${!overlay && 'shadow-lg m-auto'}`}>{renderQRCode}</div>
}
