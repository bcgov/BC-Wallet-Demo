import type { CustomCharacter } from '../../../slices/types'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import { startCase } from 'lodash'
import React from 'react'

import { rowFadeX } from '../../../FramerAnimations'
import { prependApiUrl } from '../../../utils/Url'

import { StartButton } from './StartButton'

export interface Props {
  slug: string
  title: string
  currentCharacter: CustomCharacter
  requiredCredentials: string[]
  isCompleted: boolean
  isLocked: boolean
  start(slug: string): void
}

const getCredIcon = (currChar: CustomCharacter, credName: string) => {
  let icon = ''
  currChar.useCases.forEach((useCase) => {
    useCase.screens.forEach((screen) => {
      if (screen) {
        screen.requestOptions?.requestedCredentials.forEach((cred) => {
          if (cred.name === credName) {
            icon = cred.icon ?? ''
          }
        })
      }
    })
  })
  return icon
}

export const UseCaseItem: React.FC<Props> = ({
  slug,
  title,
  isCompleted,
  requiredCredentials,
  isLocked,
  start,
  currentCharacter,
}) => {
  return (
    <motion.div variants={rowFadeX} key={slug}>
      <div
        className={`flex flex-col bg-bcgov-white dark:bg-bcgov-black rounded-lg my-2 p-4 lg:p-4 lg:px-8 mt-2 h-auto shadow-sm`}
      >
        <h1 className="flex-none font-bold text-lg mb-2 h-6">{title}</h1>
        <div className="flex h-32 mt-2">
          <div className="h-full w-1/2 mr-2 m-auto xl:w-1/5" />

          <div className="w-2/3 xl:w-1/3 flex flex-col">
            <h2 className="text-sm xl:text-base font-semibold mb-2">You'll be asked to share</h2>
            {requiredCredentials.map((item) => {
              return (
                <div key={item} className={`flex flex-row mb-2`}>
                  <img
                    className="w-4 h-4 lg:w-6 lg:h-6 mx-2"
                    src={prependApiUrl(getCredIcon(currentCharacter, item))}
                    alt="credential icon"
                  />
                  <p className="text-xs sxl:text-sm">{startCase(item)}&nbsp;</p>
                </div>
              )
            })}
            <div className="flex flex-1 items-end justify-end">
              <StartButton
                onClick={() => {
                  trackSelfDescribingEvent({
                    event: {
                      schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
                      data: {
                        action: 'start',
                        path: `${currentCharacter?.type.toLowerCase()}_${slug}`,
                        step: 'usecase_start',
                      },
                    },
                  })
                  start(slug)
                }}
                text={'START'}
                disabled={isLocked}
                isCompleted={isCompleted}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
