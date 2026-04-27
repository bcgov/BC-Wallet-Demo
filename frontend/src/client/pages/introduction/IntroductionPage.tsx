import { trackPageView } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { page } from '../../FramerAnimations'
import { CustomUpload } from '../../components/CustomUpload'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useCharacters } from '../../slices/characters/charactersSelectors'
import { fetchAllCharacters } from '../../slices/characters/charactersThunks'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { useIntroduction } from '../../slices/introduction/introductionSelectors'
import { completeIntroduction } from '../../slices/introduction/introductionSlice'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { fetchWallets } from '../../slices/wallets/walletsThunks'
import { basePath } from '../../utils/BasePath'
import { IntroductionComplete } from '../../utils/IntroductionUtils'

import { IntroductionContainer } from './IntroductionContainer'
import { Stepper } from './components/Stepper'

export const IntroductionPage: React.FC = () => {
  useTitle('Get Started | BC Wallet Self-Sovereign Identity Demo')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { characters, currentCharacter, uploadedCharacter } = useCharacters()

  const { introductionStep, isCompleted } = useIntroduction()
  const { state, invitationUrl, id } = useConnection()
  const { characterUploadEnabled, showHiddenScenarios } = usePreferences()

  const [mounted, setMounted] = useState(false)

  const allCharacters = useMemo(() => {
    const allChars = [...characters].filter((char) => !char.hidden || showHiddenScenarios)

    if (uploadedCharacter) {
      allChars.push(uploadedCharacter)
    }

    return allChars
  }, [characters, uploadedCharacter, showHiddenScenarios])

  useEffect(() => {
    if ((IntroductionComplete(introductionStep) || isCompleted) && currentCharacter) {
      dispatch(completeIntroduction())
      dispatch(clearCredentials())
      dispatch(clearConnection())
      navigate(`${basePath}/dashboard`)
    } else {
      dispatch(fetchWallets())
      dispatch(fetchAllCharacters())
      setMounted(true)
    }
  }, [dispatch, showHiddenScenarios])

  useEffect(() => {
    trackPageView()
  }, [])

  return (
    <>
      {characterUploadEnabled && <CustomUpload />}
      <motion.div
        variants={page}
        initial="hidden"
        animate="show"
        exit="exit"
        className="container flex flex-col items-center p-4"
      >
        <Stepper currentCharacter={currentCharacter} introductionStep={introductionStep} />
        <AnimatePresence mode="wait">
          {mounted && (
            <IntroductionContainer
              characters={allCharacters}
              currentCharacter={currentCharacter}
              introductionStep={introductionStep}
              connectionId={id}
              connectionState={state}
              invitationUrl={invitationUrl}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
