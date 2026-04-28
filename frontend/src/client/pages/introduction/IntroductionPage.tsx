import { trackPageView } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { page } from '../../FramerAnimations'
import { CustomUpload } from '../../components/CustomUpload'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { useIntroduction } from '../../slices/introduction/introductionSelectors'
import { completeIntroduction } from '../../slices/introduction/introductionSlice'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { fetchAllShowcases } from '../../slices/showcases/showcasesThunks'
import { fetchWallets } from '../../slices/wallets/walletsThunks'
import { basePath } from '../../utils/BasePath'
import { IntroductionComplete } from '../../utils/IntroductionUtils'

import { IntroductionContainer } from './IntroductionContainer'
import { Stepper } from './components/Stepper'

export const IntroductionPage: React.FC = () => {
  useTitle('Get Started | BC Wallet Self-Sovereign Identity Demo')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { showcases, currentShowcase, uploadedShowcase } = useShowcases()

  const { introductionStep, isCompleted } = useIntroduction()
  const { state, invitationUrl, id } = useConnection()
  const { showcaseUploadEnabled, showHiddenScenarios } = usePreferences()

  const [mounted, setMounted] = useState(false)

  const allShowcases = useMemo(() => {
    const all = [...showcases].filter((showcase) => !showcase.hidden || showHiddenScenarios)

    if (uploadedShowcase) {
      all.push(uploadedShowcase)
    }

    return all
  }, [showcases, uploadedShowcase, showHiddenScenarios])

  useEffect(() => {
    if ((IntroductionComplete(introductionStep) || isCompleted) && currentShowcase) {
      dispatch(completeIntroduction())
      dispatch(clearCredentials())
      dispatch(clearConnection())
      navigate(`${basePath}/dashboard`)
    } else {
      dispatch(fetchWallets())
      dispatch(fetchAllShowcases())
      setMounted(true)
    }
  }, [dispatch, showHiddenScenarios])

  useEffect(() => {
    trackPageView()
  }, [])

  return (
    <>
      {showcaseUploadEnabled && <CustomUpload />}
      <motion.div
        variants={page}
        initial="hidden"
        animate="show"
        exit="exit"
        className="container flex flex-col items-center p-4"
      >
        <Stepper currentShowcase={currentShowcase} introductionStep={introductionStep} />
        <AnimatePresence mode="wait">
          {mounted && (
            <IntroductionContainer
              showcases={allShowcases}
              currentShowcase={currentShowcase}
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
