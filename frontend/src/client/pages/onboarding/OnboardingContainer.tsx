import type { CustomCharacter } from '../../slices/types'

import { trackSelfDescribingEvent } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import { fadeDelay, fadeExit } from '../../FramerAnimations'
import { Modal } from '../../components/Modal'
import { useAppDispatch } from '../../hooks/hooks'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { useCredentials } from '../../slices/credentials/credentialsSelectors'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { completeOnboarding } from '../../slices/onboarding/onboardingSlice'
import { basePath } from '../../utils/BasePath'
import { isConnected } from '../../utils/Helpers'
import { addOnboardingProgress, removeOnboardingProgress } from '../../utils/OnboardingUtils'
import { prependApiUrl } from '../../utils/Url'

import { CharacterContent } from './components/CharacterContent'
import { OnboardingBottomNav } from './components/OnboardingBottomNav'
import { AcceptCredential } from './steps/AcceptCredential'
import { BasicSlide } from './steps/BasicSlide'
import { ChooseWallet } from './steps/ChooseWallet'
import { PickCharacter } from './steps/PickCharacter'
import { SetupCompleted } from './steps/SetupCompleted'
import { SetupConnection } from './steps/SetupConnection'
import { SetupStart } from './steps/SetupStart'

export interface Props {
  characters: CustomCharacter[]
  currentCharacter?: CustomCharacter
  connectionId?: string
  connectionState?: string
  invitationUrl?: string
  onboardingStep: string
}

export const OnboardingContainer: React.FC<Props> = ({
  characters,
  currentCharacter,
  onboardingStep,
  connectionId,
  connectionState,
  invitationUrl,
}) => {
  const dispatch = useAppDispatch()
  const { issuedCredentials } = useCredentials()
  const idToTitle: Record<string, string> = {}
  currentCharacter?.onboarding.forEach((item) => {
    idToTitle[item.screenId] = item.title
  })

  const connectionCompleted = isConnected(connectionState as string)
  const credentials = currentCharacter?.onboarding.find((step) => step.screenId === onboardingStep)?.credentials
  const credentialsAccepted = credentials?.every((cred) => issuedCredentials.includes(cred.name))

  const isBackDisabled = ['PICK_CHARACTER', 'ACCEPT_CREDENTIAL'].includes(onboardingStep)
  const isForwardDisabled =
    (onboardingStep.startsWith('CONNECT') && !connectionCompleted) ||
    (onboardingStep === 'ACCEPT_CREDENTIAL' && !credentialsAccepted) ||
    (onboardingStep === 'ACCEPT_CREDENTIAL' && credentials?.length === 0) ||
    (onboardingStep === 'PICK_CHARACTER' && !currentCharacter)

  const jumpOnboardingPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'skip_credential',
          path: currentCharacter?.type.toLowerCase(),
          step: idToTitle[onboardingStep],
        },
      },
    })
    addOnboardingProgress(dispatch, onboardingStep, currentCharacter, 2)
  }

  const nextOnboardingPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'next',
          path: currentCharacter?.type.toLowerCase(),
          step: idToTitle[onboardingStep],
        },
      },
    })
    addOnboardingProgress(dispatch, onboardingStep, currentCharacter)
  }

  const prevOnboardingPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'back',
          path: currentCharacter?.type.toLowerCase(),
          step: idToTitle[onboardingStep],
        },
      },
    })
    removeOnboardingProgress(dispatch, onboardingStep, currentCharacter)
  }

  //override title and text content to make them character dependant
  const getCharacterContent = (progress: string) => {
    const characterContent = currentCharacter?.onboarding.find((screen) => screen.screenId === progress)
    if (characterContent) {
      return {
        title: characterContent.title,
        text: characterContent.text,
        credentials: characterContent.credentials,
        issuer_name: characterContent.issuer_name,
        image: characterContent.image,
      }
    }
    return { title: '', text: '' }
  }
  useEffect(() => {
    if (onboardingStep.startsWith('CONNECT') && connectionCompleted) {
      nextOnboardingPage()
    }
  }, [connectionState])

  const getComponentToRender = (progress: string) => {
    const { text, title, credentials, issuer_name } = getCharacterContent(progress)
    if (progress === 'PICK_CHARACTER') {
      return (
        <PickCharacter
          key={progress}
          currentCharacter={currentCharacter}
          characters={characters}
          title={title}
          text={text}
        />
      )
    } else if (progress === 'SETUP_START') {
      return <SetupStart key={progress} title={title} text={text} />
    } else if (progress === 'CHOOSE_WALLET') {
      return <ChooseWallet key={progress} title={title} text={text} addOnboardingProgress={nextOnboardingPage} />
    } else if (progress.startsWith('CONNECT')) {
      return (
        <SetupConnection
          key={progress}
          connectionId={connectionId}
          skipIssuance={jumpOnboardingPage}
          nextSlide={nextOnboardingPage}
          invitationUrl={invitationUrl}
          issuerName={issuer_name ?? 'Unknown'}
          newConnection
          disableSkipConnection={false}
          connectionState={connectionState}
          title={title}
          text={text}
          backgroundImage={currentCharacter?.image}
        />
      )
    } else if (progress.startsWith('ACCEPT') && credentials && connectionId) {
      return (
        <AcceptCredential
          key={progress}
          connectionId={connectionId}
          credentials={credentials}
          currentCharacter={currentCharacter}
          title={title}
          text={text}
        />
      )
    } else if (progress === 'SETUP_COMPLETED') {
      return (
        <SetupCompleted key={progress} title={title} text={text} characterName={currentCharacter?.name ?? 'Unknown'} />
      )
    } else {
      return <BasicSlide title={title} text={text} />
    }
  }

  const getImageToRender = (progress: string) => {
    const { image } = getCharacterContent(progress)
    if (progress === 'PICK_CHARACTER') {
      return <CharacterContent key={progress} character={currentCharacter} />
    } else {
      return (
        <motion.img
          variants={fadeExit}
          initial="hidden"
          animate="show"
          exit="exit"
          className="p-4"
          key={progress}
          src={prependApiUrl(image ?? '')}
          alt={progress}
        />
      )
    }
  }

  const navigate = useNavigate()
  const onboardingCompleted = () => {
    if (connectionId && currentCharacter) {
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
          path: currentCharacter?.type.toLowerCase(),
          step: idToTitle[onboardingStep],
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
      <div className={`flex flex-col grid justify-items-end ${isMobile ? 'w-full' : 'w-2/3'} px-8`}>
        <div className="w-full">
          <motion.button onClick={showLeaveModal} variants={fadeDelay}>
            <FiLogOut className="inline h-12 cursor-pointer dark:text-white" />
          </motion.button>
        </div>
        <AnimatePresence mode="wait">{getComponentToRender(onboardingStep)}</AnimatePresence>
        <OnboardingBottomNav
          onboardingStep={onboardingStep}
          addOnboardingStep={nextOnboardingPage}
          removeOnboardingStep={prevOnboardingPage}
          forwardDisabled={isForwardDisabled}
          backDisabled={isBackDisabled}
          onboardingCompleted={onboardingCompleted}
        />
      </div>
      {!isMobile && (
        <div className="bg-bcgov-white dark:bg-bcgov-black hidden lg:flex lg:w-1/3 rounded-r-lg flex-col justify-center h-full select-none">
          <AnimatePresence mode="wait">{getImageToRender(onboardingStep)}</AnimatePresence>
        </div>
      )}
      {leaveModal && (
        <Modal title={LEAVE_MODAL_TITLE} description={LEAVE_MODAL_DESCRIPTION} onOk={leave} onCancel={closeLeave} />
      )}
    </motion.div>
  )
}
