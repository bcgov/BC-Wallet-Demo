import type { Credential, Showcase } from '../../slices/types'

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
import { completeIntroduction } from '../../slices/introduction/introductionSlice'
import { basePath } from '../../utils/BasePath'
import { isConnected } from '../../utils/Helpers'
import { addIntroductionProgress, removeIntroductionProgress } from '../../utils/IntroductionUtils'
import { prependApiUrl } from '../../utils/Url'

import { CharacterContent } from './components/CharacterContent'
import { IntroductionBottomNav } from './components/IntroductionBottomNav'
import { AcceptCredential } from './steps/AcceptCredential'
import { BasicSlide } from './steps/BasicSlide'
import { ChooseWallet } from './steps/ChooseWallet'
import { PickCharacter } from './steps/PickCharacter'
import { SetupCompleted } from './steps/SetupCompleted'
import { SetupConnection } from './steps/SetupConnection'
import { SetupStart } from './steps/SetupStart'

export interface Props {
  showcases: Showcase[]
  currentShowcase?: Showcase
  connectionId?: string
  connectionState?: string
  invitationUrl?: string
  introductionStep: string
}

export const IntroductionContainer: React.FC<Props> = ({
  showcases,
  currentShowcase,
  introductionStep,
  connectionId,
  connectionState,
  invitationUrl,
}) => {
  const dispatch = useAppDispatch()
  const { issuedCredentials } = useCredentials()
  const idToTitle: Record<string, string> = {}
  currentShowcase?.introduction.forEach((item) => {
    idToTitle[item.screenId] = item.name
  })

  const connectionCompleted = isConnected(connectionState as string)
  const introStep = currentShowcase?.introduction.find((step) => step.screenId === introductionStep)
  const credentials = introStep?.credentials
    ?.map((id) => currentShowcase?.credentials.find((c) => c.id === id))
    .filter(Boolean) as Credential[] | undefined
  const credentialsAccepted = credentials?.every((cred) => issuedCredentials.includes(cred.name))

  const isBackDisabled = ['PICK_CHARACTER', 'ACCEPT_CREDENTIAL'].includes(introductionStep)
  const isForwardDisabled =
    (introductionStep.startsWith('CONNECT') && !connectionCompleted) ||
    (introductionStep === 'ACCEPT_CREDENTIAL' && !credentialsAccepted) ||
    (introductionStep === 'ACCEPT_CREDENTIAL' && credentials?.length === 0) ||
    (introductionStep === 'PICK_CHARACTER' && !currentShowcase)

  const jumpIntroductionPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'skip_credential',
          path: currentShowcase?.persona.type.toLowerCase(),
          step: idToTitle[introductionStep],
        },
      },
    })
    addIntroductionProgress(dispatch, introductionStep, currentShowcase, 2)
  }

  const nextIntroductionPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'next',
          path: currentShowcase?.persona.type.toLowerCase(),
          step: idToTitle[introductionStep],
        },
      },
    })
    addIntroductionProgress(dispatch, introductionStep, currentShowcase)
  }

  const prevIntroductionPage = () => {
    trackSelfDescribingEvent({
      event: {
        schema: 'iglu:ca.bc.gov.digital/action/jsonschema/1-0-0',
        data: {
          action: 'back',
          path: currentShowcase?.persona.type.toLowerCase(),
          step: idToTitle[introductionStep],
        },
      },
    })
    removeIntroductionProgress(dispatch, introductionStep, currentShowcase)
  }

  //override name and text content to make them showcase dependant
  const getCharacterContent = (progress: string) => {
    const characterContent = currentShowcase?.introduction.find((screen) => screen.screenId === progress)
    if (characterContent) {
      const stepCredentials = characterContent.credentials
        ?.map((id) => currentShowcase?.credentials.find((c) => c.id === id))
        .filter(Boolean) as Credential[] | undefined
      return {
        title: characterContent.name,
        text: characterContent.text,
        credentials: stepCredentials,
        issuer_name: characterContent.issuer_name,
        image: characterContent.image,
      }
    }
    return { title: '', text: '' }
  }
  useEffect(() => {
    if (introductionStep.startsWith('CONNECT') && connectionCompleted) {
      nextIntroductionPage()
    }
  }, [connectionState])

  const getComponentToRender = (progress: string) => {
    const { text, title, credentials, issuer_name } = getCharacterContent(progress)
    if (progress === 'PICK_CHARACTER') {
      return (
        <PickCharacter
          key={progress}
          currentShowcase={currentShowcase}
          showcases={showcases}
          title={title}
          text={text}
        />
      )
    } else if (progress === 'SETUP_START') {
      return <SetupStart key={progress} title={title} text={text} />
    } else if (progress === 'CHOOSE_WALLET') {
      return <ChooseWallet key={progress} title={title} text={text} addIntroductionProgress={nextIntroductionPage} />
    } else if (progress.startsWith('CONNECT')) {
      return (
        <SetupConnection
          key={progress}
          connectionId={connectionId}
          skipIssuance={jumpIntroductionPage}
          nextSlide={nextIntroductionPage}
          invitationUrl={invitationUrl}
          issuerName={issuer_name ?? 'Unknown'}
          newConnection
          disableSkipConnection={false}
          connectionState={connectionState}
          title={title}
          text={text}
          backgroundImage={currentShowcase?.persona.image}
        />
      )
    } else if (progress.startsWith('ACCEPT') && credentials && connectionId) {
      return (
        <AcceptCredential
          key={progress}
          connectionId={connectionId}
          credentials={credentials}
          currentShowcase={currentShowcase}
          title={title}
          text={text}
        />
      )
    } else if (progress === 'SETUP_COMPLETED') {
      return (
        <SetupCompleted
          key={progress}
          title={title}
          text={text}
          characterName={currentShowcase?.persona.name ?? 'Unknown'}
        />
      )
    } else {
      return <BasicSlide title={title} text={text} />
    }
  }

  const getImageToRender = (progress: string) => {
    const { image } = getCharacterContent(progress)
    if (progress === 'PICK_CHARACTER') {
      return <CharacterContent key={progress} showcase={currentShowcase} />
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
  const introductionCompleted = () => {
    if (connectionId && currentShowcase) {
      navigate(`${basePath}/dashboard`)
      dispatch(clearCredentials())
      dispatch(clearConnection())
      dispatch(completeIntroduction())
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
          path: currentShowcase?.persona.type.toLowerCase(),
          step: idToTitle[introductionStep],
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
        <AnimatePresence mode="wait">{getComponentToRender(introductionStep)}</AnimatePresence>
        <IntroductionBottomNav
          introductionStep={introductionStep}
          addIntroductionStep={nextIntroductionPage}
          removeIntroductionStep={prevIntroductionPage}
          forwardDisabled={isForwardDisabled}
          backDisabled={isBackDisabled}
          introductionCompleted={introductionCompleted}
        />
      </div>
      {!isMobile && (
        <div className="bg-bcgov-white dark:bg-bcgov-black hidden lg:flex lg:w-1/3 rounded-r-lg flex-col justify-center h-full select-none">
          <AnimatePresence mode="wait">{getImageToRender(introductionStep)}</AnimatePresence>
        </div>
      )}
      {leaveModal && (
        <Modal title={LEAVE_MODAL_TITLE} description={LEAVE_MODAL_DESCRIPTION} onOk={leave} onCancel={closeLeave} />
      )}
    </motion.div>
  )
}
