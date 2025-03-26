import type { ReactElement } from 'react'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'

import { showcaseServerBaseUrl } from '../../api/BaseUrl'
import { Modal } from '../../components/Modal'
import { fadeDelay, fadeExit } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { clearConnection } from '../../slices/connection/connectionSlice'
//import { useCredentials } from '../../slices/credentials/credentialsSelectors'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { completeOnboarding, setScenario } from '../../slices/onboarding/onboardingSlice'
import type { Persona, Scenario, Step } from '../../slices/types'
import { basePath } from '../../utils/BasePath'
import { isConnected } from '../../utils/Helpers'
import { setOnboardingProgress } from '../../utils/OnboardingUtils'
import { OnboardingBottomNav } from './components/OnboardingBottomNav'
import { PersonaContent } from './components/PersonaContent'
import { PickPersona } from './steps/PickPersona'
import { SetupCompleted } from './steps/SetupCompleted'
import { StepView } from './steps/StepView'

export interface Props {
  scenarios: Scenario[]
  currentPersona?: Persona
  connectionId?: string
  connectionState?: string
  invitationUrl?: string
  currentStep?: Step
}

export const OnboardingContainer: React.FC<Props> = ({
  scenarios,
  currentPersona,
  currentStep,
  connectionId,
  connectionState,
  invitationUrl,
}) => {
  const dispatch = useAppDispatch()
  const [currentScenario, setCurrentScenario] = useState<Scenario | undefined>()

  useEffect((): void => {
    setCurrentScenario(scenarios.find((scenario) => scenario.persona?.id === currentPersona?.id))
  }, [scenarios, currentPersona])

  useEffect((): void => {
    dispatch(setScenario(currentScenario))
    if (currentScenario) {
      setOnboardingProgress(dispatch, currentScenario.steps[0])
    }
  }, [currentScenario])

  const connectionCompleted = isConnected(connectionState as string)
  //const credentials: any[] = [] //currentPersona?.onboarding.find((step: any) => step.screenId === onboardingStep)?.credentials // TODO we need credentials
  //const credentialsAccepted = credentials?.every((cred: any) => issuedCredentials.includes(cred.name))
  const isBackDisabled: boolean = !currentStep || currentStep.order === 1
  const isForwardDisabled: boolean = !currentStep || currentScenario?.steps.length === currentStep.order ||
      ((currentStep?.actions?.some((action) => action.actionType === 'SETUP_CONNECTION') ?? false) &&
          !connectionCompleted)

  const nextOnboardingPage = async (): Promise<void> => {
    const nextStep = currentScenario?.steps[currentStep !== undefined ? currentStep.order : 0]
    if (nextStep) {
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'next',
            path: currentPersona?.role.toLowerCase(),
            step: currentStep,
          },
        },
      })

      setOnboardingProgress(dispatch, nextStep)
    }
  }

  const prevOnboardingPage = async (): Promise<void> => {
    const prevStep = currentStep && currentScenario?.steps[currentStep.order - 2]
    if (prevStep) {
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'back',
            path: currentPersona?.role.toLowerCase(),
            step: currentStep,
          },
        },
      })

      setOnboardingProgress(dispatch, prevStep)
    }
  }

  const getComponentToRender = (): ReactElement => {
    if (!currentStep || currentStep.order === 1) {
      return (
          <PickPersona
              currentPersona={currentPersona}
              personas={scenarios.map((scenario) => scenario.persona)}
              title={currentStep?.title}
              text={currentStep?.description}
          />
      )
    } else if (currentScenario?.steps.length === currentStep.order) {
      return <SetupCompleted title={currentStep.title} text={currentStep.description} />
    } else {
      return (
          <StepView
              title={currentStep.title}
              text={currentStep.description}
              actions={currentStep.actions}
              nextStep={nextOnboardingPage}
              connectionState={connectionState}
              invitationUrl={invitationUrl}
              connectionId={connectionId}
              issuerName={currentScenario?.issuer?.name}
          />
      )
    }
  }

  const getImageToRender = () => {
    if (!currentStep || currentStep.order === 1) {
      return <PersonaContent persona={currentPersona} />
    } else if (currentStep.asset) {
      return (
          <motion.img
              variants={fadeExit}
              initial="hidden"
              animate="show"
              exit="exit"
              className="p-4"
              src={`${showcaseServerBaseUrl}/assets/${currentStep.asset}/file`}
          />
      )
    }
  }

  const navigate = useNavigate()
  const onboardingCompleted = () => {
    if (connectionId && currentPersona) {
      navigate(`${basePath}/dashboard`)
      dispatch(clearCredentials())
      dispatch(clearConnection())
      dispatch(completeOnboarding())
    } else {
      // something went wrong so reset
      navigate(`${basePath}/`)
      dispatch({ type: 'demo/RESET' })
    }
  }

  const style = isMobile ? { minHeight: '85vh' } : { minHeight: '680px', height: '75vh', maxHeight: '940px' }

  const [leaveModal, setLeaveModal] = useState(false)
  const LEAVE_MODAL_TITLE = 'Are you sure you want to leave?'
  const LEAVE_MODAL_DESCRIPTION = `You're progress will be lost and you'll be redirected to the homepage.`
  const showLeaveModal = () => setLeaveModal(true)
  const closeLeave = () => setLeaveModal(false)

  const leave = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: currentPersona?.role.toLowerCase(),
          step: currentStep,
        },
      },
    })
    navigate(`${basePath}/`)
    dispatch({ type: 'demo/RESET' })
  }

  return (
      <motion.div
          className="flex flex-row h-full justify-between bg-white dark:bg-bcgov-darkgrey rounded-lg p-2 w-full sxl:w-5/6 shadow"
          style={style}
      >
        <div className={`flex flex-col justify-items-end ${isMobile ? 'w-full' : 'w-2/3'} px-8`}>
          <div className="w-full">
            <motion.button onClick={showLeaveModal} variants={fadeDelay}>
              <FiLogOut className="inline h-12 cursor-pointer dark:text-white" />
            </motion.button>
          </div>
          <AnimatePresence mode="wait">{getComponentToRender()}</AnimatePresence>
          <OnboardingBottomNav
              currentStep={currentStep?.order}
              maxSteps={currentScenario?.steps.length}
              addOnboardingStep={nextOnboardingPage}
              removeOnboardingStep={prevOnboardingPage}
              forwardDisabled={isForwardDisabled}
              backDisabled={isBackDisabled}
              onboardingCompleted={onboardingCompleted}
          />
        </div>
        {!isMobile && (
            <div className="bg-bcgov-white dark:bg-bcgov-black hidden lg:flex lg:w-1/3 rounded-r-lg flex-col justify-center h-full select-none">
              <AnimatePresence mode="wait">{getImageToRender()}</AnimatePresence>
            </div>
        )}
        {leaveModal && (
            <Modal title={LEAVE_MODAL_TITLE} description={LEAVE_MODAL_DESCRIPTION} onOk={leave} onCancel={closeLeave} />
        )}
      </motion.div>
  )
}
