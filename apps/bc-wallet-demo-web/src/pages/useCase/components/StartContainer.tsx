import React, {FC} from 'react'
import { isMobile } from 'react-device-detect'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate, useParams } from 'react-router-dom'
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion } from 'framer-motion'
import { SmallButton } from '../../../components/SmallButton'
import { fadeExit } from '../../../FramerAnimations'
import { useAppDispatch } from '../../../hooks/hooks'
import { nextStep } from '../../../slices/useCases/useCasesSlice'
import { basePath } from '../../../utils/BasePath'
import { StarterInfo } from './StarterInfo'
import { showcaseServerBaseUrl } from '../../../api/BaseUrl'
import type {
  CredentialRequest,
  Persona,
  Showcase,
  Step,
  PresentationScenario
} from '../../../slices/types'

export interface Props {
  showcase: Showcase
  currentPersona: Persona
  scenario: PresentationScenario
  currentStep: Step
  requestedCredentials?: CredentialRequest[]
}

export const StartContainer: FC<Props> = (props: Props) => {
  const {
    requestedCredentials,
    currentStep,
    showcase,
    currentPersona,
    scenario
  } = props
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
          path: `${currentPersona.role}_${slug}`,
          step: currentStep.title,
        },
      },
    })
    navigate(`${basePath}/${showcase.slug}/${currentPersona.slug}/presentations`)
  }

  const next = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'start',
          path: `${currentPersona.role}_${slug}`,
          step: currentStep.title,
        },
      },
    })
    if (scenario?.steps.length === currentStep.order) {
      leave()
    } else {
      dispatch(nextStep())
    }
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
          title={currentStep.title}
          description={currentStep.description ?? ''}
          entity={scenario.relyingParty}
          requestedCredentials={requestedCredentials}
        />
        <div className="flex justify-between content-center bg-bcgovgrey dark:bg-bcgov-darkgrey ">
          <button onClick={leave}>
            <FiLogOut className="ml-2 inline h-8 cursor-pointer" />
          </button>
          <SmallButton onClick={next} text={scenario?.steps.length === currentStep.order ? 'COMPLETE' : 'START'} disabled={false} />
        </div>
      </div>
      <div className="bg-bcgov-white dark:bg-bcgov-black hidden lg:flex lg:w-1/3 rounded-r-lg flex content-center p-4 select-none">
        {currentStep.asset && <img className="p-8" src={`${showcaseServerBaseUrl}/assets/${currentStep.asset}/file`} alt={currentStep.title} />}
      </div>
    </motion.div>
  )
}
