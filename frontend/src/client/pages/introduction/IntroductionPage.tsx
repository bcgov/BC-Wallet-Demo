import { trackPageView } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { page } from '../../FramerAnimations'
import { CustomUpload } from '../../components/CustomUpload'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { useIntroduction } from '../../slices/introduction/introductionSelectors'
import { completeIntroduction, setIntroductionStep } from '../../slices/introduction/introductionSlice'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { fetchAllShowcases, fetchShowcaseBySlug } from '../../slices/showcases/showcasesThunks'
import { fetchWallets } from '../../slices/wallets/walletsThunks'
import { basePath } from '../../utils/BasePath'
import { IntroductionComplete } from '../../utils/IntroductionUtils'
import { PageNotFound } from '../PageNotFound'

import { IntroductionContainer } from './IntroductionContainer'
import { Stepper } from './components/Stepper'

export const IntroductionPage: React.FC = () => {
  useTitle('Get Started | BC Digital Trust Showcase')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { showcaseSlug } = useParams<{ showcaseSlug?: string }>()
  const { showcases, currentShowcase, uploadedShowcase, slugLookupFailed } = useShowcases()

  const { introductionStep, isCompleted } = useIntroduction()
  const { state, invitationUrl, shortInvitationUrl, id } = useConnection()
  const { showcaseUploadEnabled, showHiddenScenarios } = usePreferences()

  const [mounted, setMounted] = useState(false)

  const allShowcases = useMemo(() => {
    const all = [...showcases].filter((showcase) => showcase.status === 'active' || showHiddenScenarios)

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
      return
    }
    dispatch({ type: 'demo/RESET' })
    dispatch(fetchWallets())
    if (showcaseSlug) {
      // Direct link: load the showcase by its slug and skip straight past persona selection.
      dispatch(fetchShowcaseBySlug(showcaseSlug))
        .unwrap()
        .then(() => {
          dispatch(setIntroductionStep('SETUP_START'))
          setMounted(true)
        })
        .catch(() => undefined)
    } else {
      dispatch(fetchAllShowcases())
      setMounted(true)
    }
    // Runs once on mount only; toggling showHiddenScenarios must not re-trigger this redirect/reset
  }, [dispatch])

  useEffect(() => {
    trackPageView()
  }, [])

  if (showcaseSlug && slugLookupFailed) {
    return <PageNotFound />
  }

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
              shortInvitationUrl={shortInvitationUrl}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
