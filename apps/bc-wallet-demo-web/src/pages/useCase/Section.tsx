import React, { useEffect, useState } from 'react'
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
import type { ConnectionState } from '../../slices/connection/connectionSlice'
import { useCaseCompleted } from '../../slices/preferences/preferencesSlice'
import { useCurrentPersona } from '../../slices/showcases/showcasesSelectors'
import type { UseCaseScreen } from '../../slices/types'
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

export interface Props {
  section: UseCaseScreen[]
  connection: ConnectionState
  stepCount: number
  sectionCount: number
  credentials: any[]
  proof?: any
}

export const Section: React.FC<Props> = ({ connection, section, stepCount, sectionCount, credentials, proof }) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const style = isMobile ? { height: '700px' } : { minHeight: '800px', height: '80vh' }

  const [isBackDisabled, setIsBackDisabled] = useState(false)
  const [isForwardDisabled, setIsForwardDisabled] = useState(false)

  const [leaveModal, setLeaveModal] = useState(false)
  const LEAVE_MODAL_TITLE = 'Are you sure you want to leave?'
  const LEAVE_MODAL_DESCRIPTION = `You'll be redirected to the dashboard.`

  const showLeaveModal = () => setLeaveModal(true)
  const closeLeave = () => setLeaveModal(false)

  const step = section[stepCount]

  const prev = () => dispatch(prevStep())
  const next = () => dispatch(nextStep())

  const isConnectionCompleted = isConnected(connection.state as string)
  const isProofCompleted =
    (proof?.state as string) === 'presentation_received' ||
    (proof?.state as string) === 'verified' ||
    proof?.state === 'done'
  const credentialsReceived = Object.values(credentials).every((x) => isCredIssued(x.state))

  const [completed, setCompleted] = useState(false)
  const { slug } = useParams()

  const verifier = section.find((x) => x.verifier !== undefined)?.verifier ?? { name: 'Unkown' }
  const currentCharacter = useCurrentPersona()

  const leave = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'leave',
          path: ``, // ${currentCharacter?.type.toLowerCase()}_${slug}`, // FIXME?
          step: step.title,
        },
      },
    })
    navigate(`${basePath}/dashboard`)
    dispatch({ type: 'clearUseCase' })
    dispatch(resetStep())
  }

  useEffect(() => {
    if (completed && slug) {
      dispatch(useCaseCompleted(slug))
      dispatch({ type: 'clearUseCase' })
      navigate(`${basePath}/dashboard`)
      dispatch(resetStep())
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'usecase_completed',
            path: ``, // ${currentCharacter?.type.toLowerCase()}_${slug}`, FIXME?
            step: step.title,
          },
        },
      })
    }
  }, [completed, dispatch, slug])

  useEffect(() => {
    if (step?.screenId.startsWith('CONNECTION')) {
      if (isConnectionCompleted) {
        setIsForwardDisabled(false)
      } else {
        setIsForwardDisabled(true)
      }
    }

    if (step?.screenId.startsWith('PROOF') || step?.screenId.startsWith('PROOF_OOB')) {
      if (isProofCompleted) {
        setIsForwardDisabled(false)
      } else {
        setIsForwardDisabled(true)
      }
    }

    if (step?.screenId.startsWith('CREDENTIAL')) {
      if (credentialsReceived) {
        setIsForwardDisabled(false)
      } else {
        setIsForwardDisabled(true)
      }
    }

    // button is never disabled on INFO step
    if (step?.screenId.startsWith('INFO')) {
      setIsForwardDisabled(false)
    }

    // buttons are never disabled on the first step
    if (stepCount === 0) {
      setIsBackDisabled(true)
    } else {
      setIsBackDisabled(false)
    }
  }, [stepCount, proof, connection.state, credentials])

  useEffect(() => {
    // automatically go to next step if connection is set up
    if (step?.screenId.startsWith('CONNECTION') && isConnectionCompleted) {
      next()
      trackSelfDescribingEvent({
        event: {
          schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
          data: {
            action: 'next',
            path: ``, // ${currentCharacter?.type.toLowerCase()}_${slug}`, FIXME?
            step: step.title,
          },
        },
      })
    }
  }, [connection.state])

  useEffect(() => {
    if (isMobile) {
      // reset mobile scroll on first & last step
      if (step.screenId.startsWith('START') || step.screenId.startsWith('END')) {
        window.scrollTo(0, 0)
      }
    }
  }, [stepCount, sectionCount])

  const renderStepItem = () => {
    if (step.screenId.startsWith('START')) {
      return (
        <StartContainer
          key={step.screenId}
          characterType={undefined} // FIXME? currentCharacter?.type.toLowerCase()}
          step={step}
          entity={verifier}
          requestedCredentials={step.requestOptions?.requestedCredentials}
        />
      )
    }
    if (step.screenId.startsWith('END')) {
      return <EndContainer key={step.screenId} step={step} />
    } else {
      return (
        <>
          <div className="flex flex-col lg:flex-row w-full h-full">
            <SideView
              key={'sideView'}
              steps={section}
              currentStep={step.screenId}
              entity={verifier}
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
                {step.screenId.startsWith('INFO') && <StepInformation key={step.screenId} step={step} />}
                {step.screenId.startsWith('CONNECTION') && (
                  <StepConnection newConnection={true} key={step.screenId} step={step} connection={connection} />
                )}
                {step.screenId.startsWith('PROOF') && step.requestOptions && connection.id && (
                  <StepProof
                    key={step.screenId}
                    entityName={verifier.name}
                    characterType={undefined} // FIXME?{currentCharacter?.type.toLowerCase()}
                    proof={proof}
                    step={step}
                    connectionId={connection.id}
                    requestedCredentials={step.requestOptions.requestedCredentials}
                  />
                )}
                {step.screenId.startsWith('STEP_END') && <StepEnd key={step.screenId} step={step} />}
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
                          path: ``, // FIXME? `${currentCharacter?.type.toLowerCase()}_${slug}`,
                          step: step.title,
                        },
                      },
                    })
                  }}
                  disabled={isBackDisabled}
                />
                {step.screenId.startsWith('STEP_END') ? (
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
                            path: ``, // FIXME? ${currentCharacter?.type.toLowerCase()}_${slug}`,
                            step: step.title,
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

  return <AnimatePresence mode="wait">{step && renderStepItem()}</AnimatePresence>
}
