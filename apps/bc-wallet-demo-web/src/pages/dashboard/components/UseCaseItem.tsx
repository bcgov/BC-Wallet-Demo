import React from 'react'
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import { startCase } from 'lodash'
import { rowFadeX } from '../../../FramerAnimations'
import { StartButton } from './StartButton'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl';
import type { CredentialDefinition, Persona } from '../../../slices/types'

export interface Props {
  slug: string
  title: string
  currentPersona: Persona
  requiredCredentials: CredentialDefinition[]
  isCompleted: boolean
  isLocked: boolean
  start(scenarioSlug: string): void
}

export const UseCaseItem: React.FC<Props> = ({
  slug,
  title,
  isCompleted,
  requiredCredentials,
  isLocked,
  start,
  currentPersona,
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
            {requiredCredentials.map((requiredCredential) => {
              return (
                <div key={requiredCredential.id} className={`flex flex-row mb-2`}>
                  <img
                    className="w-4 h-4 lg:w-6 lg:h-6 mx-2"
                    src={`${showcaseServerBaseUrl}/assets/${requiredCredential.icon}/file`}
                    alt="credential icon"
                  />
                  <p className="text-xs sxl:text-sm">{startCase(requiredCredential.name)}&nbsp;</p>
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
                        path: `${currentPersona.role.toLowerCase()}_${slug}`,
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
