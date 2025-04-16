import React from 'react'
import { isMobile } from 'react-device-detect'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'

import { SmallButton } from '../../../components/SmallButton'
import { fadeExit } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import type { CredentialRequest, UseCaseScreen } from '../../../slices/types'
import { nextStep } from '../../../slices/useCases/useCasesSlice'
import { basePath } from '../../../utils/BasePath'
import { prependApiUrl } from '../../../utils/Url'
import { StarterInfo } from './StarterInfo'

export interface Props {
  step: UseCaseScreen
  characterType?: string
  entity: { name: string; icon?: string }
  requestedCredentials?: CredentialRequest[]
}

export const StartContainer: React.FC<Props> = ({ entity, requestedCredentials, step, characterType }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { slug } = useParams()

  const style = isMobile ? { minHeight: '85vh' } : { maxHeight: '940px' }

  const leave = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: `${characterType}_${slug}`,
          step: step.title,
        },
      },
    })
    navigate(`${basePath}/dashboard`)
  }

  const next = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'start',
          path: `${characterType}_${slug}`,
          step: step.title,
        },
      },
    })
    dispatch(nextStep())
  }
  return (
    <motion.div
      variants={fadeExit}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex flex-row bg-white dark:bg-bcgov-darkgrey rounded-lg p-2 h-max min-h-full my-8 shadow-sm"
      style={style}
      data-cy="start-container"
    >
      <div className="flex flex-col p-6 md:p-12 md:pb-6 xl:p-16 xl:pb-8 w-full lg:w-2/3 ">
        <StarterInfo
          title={step.title}
          description={step.text ?? ''}
          entity={entity}
          requestedCredentials={requestedCredentials}
        />

        <div className="flex justify-between content-center bg-bcgovgrey dark:bg-bcgov-darkgrey ">
          <button onClick={leave}>
            <FiLogOut className="ml-2 inline h-8 cursor-pointer" />
          </button>
          <SmallButton onClick={next} text={'START'} disabled={false} />
        </div>
      </div>
      <div className="bg-bcgov-white dark:bg-bcgov-black hidden lg:flex lg:w-1/3 rounded-r-lg flex content-center p-4 select-none">
        {step.image && <img className="p-8" src={prependApiUrl(step.image)} alt={step.title} />}
      </div>
    </motion.div>
  )
}
