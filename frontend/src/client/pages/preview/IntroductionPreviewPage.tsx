import { trackPageView } from '@snowplow/browser-tracker'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useEffect, useMemo, useState } from 'react'
import { useBeforeUnload, useSearchParams } from 'react-router-dom'

import { page } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { useIntroduction } from '../../slices/introduction/introductionSelectors'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { fetchAllShowcases } from '../../slices/showcases/showcasesThunks'
import { fetchWallets } from '../../slices/wallets/walletsThunks'
import { IntroductionContainer } from '../introduction/IntroductionContainer'
import { Stepper } from '../introduction/components/Stepper'

interface PreviewPageProps {
  contentType?: 'introduction' | 'scenarios' | 'persona'
}

export const IntroductionPreviewPage: React.FC<PreviewPageProps> = ({ contentType: propContentType } = {}) => {
  const [searchParams] = useSearchParams()
  const contentType =
    (searchParams.get('type') as 'introduction' | 'scenarios' | 'persona' | null) || propContentType || 'introduction'
  const previewShowcaseName = searchParams.get('showcase') || undefined

  useTitle('Get Started | BC Wallet Self-Sovereign Identity Demo')

  const dispatch = useAppDispatch()
  const { showcases, currentShowcase, uploadedShowcase } = useShowcases()

  const { introductionStep } = useIntroduction()
  const { state, invitationUrl, shortInvitationUrl, id } = useConnection()
  const { showHiddenScenarios } = usePreferences()

  const [mounted, setMounted] = useState(false)

  const allShowcases = useMemo(() => {
    const all = [...showcases].filter((showcase) => {
      return !previewShowcaseName || showcase.name === previewShowcaseName
    })

    if (uploadedShowcase) {
      all.push(uploadedShowcase)
    }

    return all
  }, [showcases, uploadedShowcase, previewShowcaseName])

  useEffect(() => {
    dispatch({ type: 'demo/RESET' })
    dispatch(fetchWallets())
    dispatch(fetchAllShowcases())
    setMounted(true)
  }, [dispatch, showHiddenScenarios])

  useEffect(() => {
    trackPageView()
  }, [])

  useBeforeUnload(() => {
    dispatch({ type: 'demo/RESET' })
  })

  const stopStep =
    contentType === 'persona' ? 'PICK_CHARACTER' : contentType === 'introduction' ? 'SETUP_COMPLETED' : ''

  const previewShowcase = currentShowcase || allShowcases[0]

  return (
    <>
      <motion.div
        variants={page}
        initial="hidden"
        animate="show"
        exit="exit"
        className="container flex flex-col items-center p-4"
      >
        <Stepper currentShowcase={previewShowcase} introductionStep={introductionStep} />
        <AnimatePresence mode="wait">
          {mounted && (
            <IntroductionContainer
              showcases={allShowcases}
              currentShowcase={contentType === 'persona' ? undefined : previewShowcase}
              introductionStep={introductionStep}
              connectionId={id}
              connectionState={state}
              invitationUrl={invitationUrl}
              shortInvitationUrl={shortInvitationUrl}
              stopStep={stopStep}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}
