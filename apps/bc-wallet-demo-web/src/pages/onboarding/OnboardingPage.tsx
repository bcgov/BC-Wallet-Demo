import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { trackPageView } from '@snowplow/browser-tracker'
import { motion, AnimatePresence } from 'framer-motion'

import { CustomUpload } from '../../components/CustomUpload'
import { page } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { useOnboarding } from '../../slices/onboarding/onboardingSelectors'
import { completeOnboarding } from '../../slices/onboarding/onboardingSlice'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { clearShowcase } from '../../slices/showcases/showcasesSlice'
import { fetchShowcaseBySlug } from '../../slices/showcases/showcasesThunks'
import { fetchWallets } from '../../slices/wallets/walletsThunks'
import { basePath } from '../../utils/BasePath'
import { useSlug } from '../../utils/SlugUtils'
import { PageNotFound } from '../PageNotFound'
import { Stepper } from './components/Stepper'
import { OnboardingContainer } from './OnboardingContainer'
import { ScenarioType } from 'bc-wallet-openapi'
import { getTenantIdFromPath } from '../../utils/Helpers'

export const OnboardingPage: React.FC = () => {
  useTitle('Get Started | BC Wallet Self-Sovereign Identity Demo')

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { showcase, currentPersona } = useShowcases()
  const slug = useSlug()
  const { currentStep, isCompleted, scenario } = useOnboarding()
  const { state, invitationUrl, id } = useConnection()
  const { characterUploadEnabled } = usePreferences()
  const tenantId = getTenantIdFromPath();

  useEffect(() => {
    if (isCompleted && showcase && currentPersona) {
      dispatch(completeOnboarding())
      dispatch(clearCredentials())
      dispatch(clearConnection())
      navigate(`${basePath}/${tenantId}/${showcase.slug}/${currentPersona.slug}/presentations`)
    } else if (!isCompleted && !showcase) {
      dispatch(clearShowcase())
      dispatch(fetchWallets())
      dispatch(fetchShowcaseBySlug(slug))
    }
  }, [dispatch, slug, isCompleted])

  useEffect(() => {
    trackPageView()
  }, [])

  if (showcase === undefined) {
    return <div>Loading...</div>
  }

  if (showcase === null) {
    return <PageNotFound resourceType="Showcase" resourceName={slug} />
  }

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
          {scenario?.steps !== undefined && scenario?.steps.length > 0 && currentStep && (
              <Stepper steps={scenario.steps} currentStep={currentStep.order} />
          )}
          {showcase && (
              <AnimatePresence mode="wait">
                <OnboardingContainer
                    scenarios={showcase.scenarios.filter(scenario => scenario.type === ScenarioType.Issuance)}
                    currentPersona={currentPersona}
                    currentStep={currentStep}
                    connectionId={id}
                    connectionState={state}
                    invitationUrl={invitationUrl}
                />
              </AnimatePresence>
          )}
        </motion.div>
      </>
  )
}
