import type { RevocationRecord } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'

import { rowFadeX } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'

import { StartButton } from './StartButton'

export interface Props {
  title?: string
  description?: string
  credentialName?: string
  credentialIcon?: string
  revocationRecord: RevocationRecord
  callback: () => void
  isCompleted: boolean
  isLoading?: boolean
}

export const RevocationItem: React.FC<Props> = ({
  title,
  credentialName,
  credentialIcon,
  description,
  revocationRecord,
  callback,
  isCompleted,
  isLoading,
}) => {
  return (
    <motion.div variants={rowFadeX} key={revocationRecord.revocationRegId}>
      <div
        className={`flex flex-col bg-bcgov-white dark:bg-bcgov-black rounded-lg my-2 p-4 lg:p-4 lg:px-8 mt-2 h-auto shadow-sm`}
      >
        <h1 className="flex-none font-bold text-lg mb-2 h-6">
          {title ?? revocationRecord.revocationRegId.split(':')[6]}
        </h1>
        <div className="flex h-32 mt-2">
          <motion.div style={{ overflowY: 'scroll' }} className="lg:max-w-[50%]">
            {description &&
              description.split(/\n/).map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
          </motion.div>
          <div className="h-full w-1/2 mr-2 m-auto xl:w-1/5" />
          <div className="w-2/3 xl:w-1/3 flex flex-col">
            {credentialName && (
              <motion.div>
                <h2 className="text-sm xl:text-base font-semibold mb-2">You'll revoke your</h2>
                <div className={`flex flex-row mb-2`}>
                  {credentialIcon && (
                    <img
                      className="w-4 h-4 lg:w-6 lg:h-6 mx-2"
                      src={prependApiUrl(credentialIcon)}
                      alt="credential icon"
                    />
                  )}
                  <p className="text-xs sxl:text-sm">{credentialName}&nbsp;</p>
                </div>
              </motion.div>
            )}
            <div className="flex flex-1 items-end justify-end">
              <StartButton
                onClick={callback}
                text={'REVOKE'}
                disabled={false}
                isCompleted={isCompleted}
                loading={isLoading}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
