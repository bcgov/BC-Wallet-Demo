import React, { FC, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useNavigate, useParams } from 'react-router-dom'
import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { motion, AnimatePresence } from 'framer-motion'
import { BackButton } from '../../components/BackButton'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { SmallButton } from '../../components/SmallButton'
import { fadeExit } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useCaseCompleted } from '../../slices/preferences/preferencesSlice'
import { nextStep, prevStep, resetStep } from '../../slices/useCases/useCasesSlice'
import { basePath } from '../../utils/BasePath'
import { isConnected, isCredIssued } from '../../utils/Helpers'
import { EndContainer } from './components/EndContainer'
import { StartContainer } from './components/StartContainer'
import { SideView } from './SideView'
import { StepConnection } from './steps/StepConnection'
import { StepEnd } from './steps/StepEnd'
import { StepInformation } from './steps/StepInformation'
import { StepProof } from './steps/StepProof'
import type { ConnectionState } from '../../slices/connection/connectionSlice'
import type { Persona, Showcase, UseCaseScreen, Scenario } from '../../slices/types'
import {StepActionType} from 'bc-wallet-openapi';
import {SetupConnectionAction} from '../onboarding/steps/actions/SetupConnectionAction';
import {ChooseWalletAction} from '../onboarding/steps/actions/ChooseWalletAction';
import {AcceptCredentialAction} from '../onboarding/steps/actions/AcceptCredentialAction';
import {PickPersona} from '../onboarding/steps/PickPersona';
import {SetupCompleted} from '../onboarding/steps/SetupCompleted';
import {StepView} from '../onboarding/steps/StepView';
import {useUseCaseState} from '../../slices/useCases/useCasesSelectors';

export interface Props {
  showcase: Showcase
  currentPersona: Persona
  currentScenario: Scenario
  connection: ConnectionState
  credentials: any[] // TODO any
  proof?: any
}

export const Section: FC<Props> = (props: Props) => {
  const {
    showcase,
    currentPersona,
    currentScenario,
    connection,
    credentials,
    proof
  } = props
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { stepCount, isLoading } = useUseCaseState()
  const { slug } = useParams()
  const [isBackDisabled, setIsBackDisabled] = useState(false)
  const [isForwardDisabled, setIsForwardDisabled] = useState(false)
  const [leaveModal, setLeaveModal] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isProofCompleted, setIsProofCompleted] = useState(false)

  const style = isMobile ? { height: '700px' } : { minHeight: '800px', height: '80vh' }
  const LEAVE_MODAL_TITLE = 'Are you sure you want to leave?'
  const LEAVE_MODAL_DESCRIPTION = `You'll be redirected to the dashboard.`

  const showLeaveModal = () => setLeaveModal(true)
  const closeLeave = () => setLeaveModal(false)

  const currentStep = currentScenario.steps[stepCount]

  const prev = () => dispatch(prevStep())
  const next = () => dispatch(nextStep())

  const isConnectionCompleted = isConnected(connection.state as string)

  // const credentialsReceived = Object.values(credentials).every((x) => isCredIssued(x.state))




  const leave = () => {
    setIsExiting(true)
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: `${currentPersona?.role.toLowerCase()}_${slug}`,
          step: currentStep.title,
        },
      },
    })
    navigate(`${basePath}/${showcase.slug}/${currentPersona.slug}/presentations`)
    dispatch({ type: 'clearUseCase' })
    dispatch(resetStep())
  }

  useEffect(() => {
    const result =
        (proof?.state as string) === 'presentation_received' ||
        (proof?.state as string) === 'verified' ||
        proof?.state === 'done'
    console.log(`LOGGING PROOF CHANGE: ${proof?.state}, result ${result}`)
    setIsProofCompleted(result)
  }, [proof])

  useEffect(() => {
    setIsBackDisabled(stepCount <= 0)
    setIsForwardDisabled(stepCount >= currentScenario.steps.length - 1)
  }, [stepCount])

  useEffect(() => {
    if (completed && slug) {
      dispatch(useCaseCompleted(slug))
      dispatch({ type: 'clearUseCase' })
      navigate(`${basePath}/${showcase.slug}/${currentPersona.slug}/presentations`)
      dispatch(resetStep())
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'usecase_completed',
            path: `${currentPersona?.role.toLowerCase()}_${slug}`,
            step: currentStep.title,
          },
        },
      })
    }
  }, [completed, dispatch, slug])

  useEffect(() => {
    if (currentStep.actions?.some(action => action.actionType === StepActionType.SetupConnection)) {
      if (isConnectionCompleted) {
        setIsForwardDisabled(false)
      } else {
        setIsForwardDisabled(true)
      }
    }

    if (currentStep.actions?.some(action => action.actionType === StepActionType.AriesOob)) {
      if (isProofCompleted) {
        setIsForwardDisabled(false)
      } else {
        setIsForwardDisabled(true)
      }
    }
  }, [currentStep, isConnectionCompleted, isProofCompleted])

  useEffect(() => {
    // automatically go to next step if connection is set up
    if (currentStep.actions?.some(action => action.actionType === StepActionType.SetupConnection) && isConnectionCompleted) {
      next()
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'next',
            path: `${currentPersona?.role.toLowerCase()}_${slug}`,
            step: currentStep.title,
          },
        },
      })
    }
  }, [connection.state])

  useEffect(() => {
    if (isMobile) {
      // reset mobile scroll on first & last step
      if (currentStep.order === 1 || currentScenario?.steps.length === currentStep.order ) {
        window.scrollTo(0, 0)
      }
    }
  }, [currentStep])

  const renderStepItem = () => {
    if (completed || isExiting) {
      return
    }

    if (!currentStep || currentStep.order === 1) {
      return (
          <StartContainer
              showcase={showcase}
              currentPersona={currentPersona}
              scenario={currentScenario}
              currentStep={currentStep}
              requestedCredentials={[]}//step.requestOptions?.requestedCredentials}
          />
      )
    } else {
      return (
          <>
            <div className="flex flex-col lg:flex-row w-full h-full">
              <SideView
                  key={'sideView'}
                  steps={currentScenario.steps}
                  currentStep={currentStep.order}
                  entity={currentScenario.relyingParty ?? { name: 'UNKNOWN' }}
                  showLeaveModal={showLeaveModal}
              />
              <motion.div
                  key={'mainContentDiv'}
                  variants={fadeExit}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="flex flex-col w-auto lg:w-2/3 p-8 bg-white dark:bg-bcgov-darkgrey rounded-lg shadow"
                  style={style}
                  data-cy="section"
              >
                <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
                  <StepInformation
                      title={currentStep.title}
                      description={currentStep.description}
                      asset={currentStep.asset}
                      connection={connection}
                      actions={currentStep.actions}
                      proof={proof}
                      currentPersona={currentPersona}
                      verifier={currentScenario.relyingParty}
                  />
                </AnimatePresence>
                <div className="flex justify-between items-center">
                  <BackButton
                      onClick={() => {
                        prev()
                        trackSelfDescribingEvent({
                          event: {
                            schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
                            data: {
                              action: 'back',
                              path: `${currentPersona?.role.toLowerCase()}_${slug}`,
                              step: currentStep.title,
                            },
                          },
                        })
                      }}
                      disabled={isBackDisabled}
                  />
                  {currentScenario.steps.length === currentStep.order ? (
                      <Button text="COMPLETE" onClick={() => setCompleted(true)} />
                  ) : (
                      <SmallButton
                          text="NEXT"
                          onClick={() => {
                            next()
                            trackSelfDescribingEvent({
                              event: {
                                schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
                                data: {
                                  action: 'next',
                                  path: `${currentPersona?.role.toLowerCase()}_${slug}`,
                                  step: currentStep.title,
                                },
                              },
                            })
                          }}
                          disabled={isForwardDisabled}
                          data-cy="use-case-next"
                      />
                  )}
                </div>
              </motion.div>
            </div>
            {leaveModal && (
                <Modal title={LEAVE_MODAL_TITLE} description={LEAVE_MODAL_DESCRIPTION} onOk={leave} onCancel={closeLeave} />
            )}
          </>
      )
    }
  }

  return <AnimatePresence mode="wait">{currentStep && renderStepItem()}</AnimatePresence>
}
