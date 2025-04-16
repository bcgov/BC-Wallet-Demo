import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackPageView } from '@snowplow/browser-tracker'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from 'insights-js'
import { Modal } from '../../components/Modal'
import { page } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useCredentials } from '../../slices/credentials/credentialsSelectors'
import { usePreferences } from '../../slices/preferences/preferencesSelectors'
import { setDemoCompleted } from '../../slices/preferences/preferencesSlice'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { basePath } from '../../utils/BasePath'
import { Footer } from '../landing/components/Footer'
import { NavBar } from '../landing/components/Navbar'
import { DemoCompletedModal } from './components/DemoCompletedModal'
import { ProfileCard } from './components/ProfileCard'
import { UseCaseContainer } from './components/UseCaseContainer'
import { fetchPersonaBySlug, fetchShowcaseBySlug } from '../../slices/showcases/showcasesThunks'
import { usePersonaSlug, useSlug } from '../../utils/SlugUtils'
import { PageNotFound } from '../PageNotFound'
import { ScenarioType } from 'bc-wallet-openapi'
import type { Scenario } from '../../slices/types'

export const DashboardPage: React.FC = () => {
  useTitle('Dashboard | BC Wallet Self-Sovereign Identity Demo')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { revokableCredentials } = useCredentials()
  const showcaseSlug = useSlug()
  const personaSlug = usePersonaSlug()
  const { showcase, currentPersona } = useShowcases()
  const { completedUseCaseSlugs, demoCompleted, completeCanceled, revocationEnabled, showHiddenUseCases } =  usePreferences()
  const [scenarios, setScenarios] = useState<Scenario[]>([])

  useEffect(() => {
    if (completedUseCaseSlugs.length !== 0 && completedUseCaseSlugs.length === scenarios?.length && !completeCanceled) {
      dispatch(setDemoCompleted(true))
    }
  }, [scenarios, completedUseCaseSlugs])

  useEffect(() => {
    const load = async () => {
        await dispatch(fetchShowcaseBySlug(showcaseSlug))
        await dispatch(fetchPersonaBySlug(personaSlug))
    }
    void load()
  }, [dispatch, showcaseSlug, personaSlug])

  useEffect(() => {
    trackPageView()
  }, [])

  useEffect(() => {
      if (!showcase || !currentPersona) {
        return
      }
      const result = showcase.scenarios.filter(scenario => scenario.persona.id === currentPersona.id && scenario.type === ScenarioType.Presentation )
      setScenarios(result)
  }, [showcase, currentPersona])


  if (showcase === undefined || currentPersona === undefined) {
    return <div>Loading...</div>
  }

  if (showcase === null) {
    return <PageNotFound resourceType="Showcase" resourceName={showcaseSlug} />
  }

  if (currentPersona === null) {
    return <PageNotFound resourceType="Persona" resourceName={personaSlug} />
  }

  const ERROR_TITLE = `Woops...`
  const ERROR_DESCRIPTION = `That's not gone well. Please restart the demo.`
  const routeError = () => {
    navigate(`${basePath}/`)
    dispatch({ type: 'demo/RESET' })
  }

  const completeDemo = () => {
    navigate(`${basePath}/`)
    dispatch({ type: 'demo/RESET' })

    if (currentPersona) {
      track({
        id: 'demo-character-completed',
        parameters: {
          character: currentPersona.name,
        },
      })
    }
  }

  const cancelCompleteDemo = () => {
    dispatch(setDemoCompleted(false))
  }

  return (
    <motion.div
      className="container flex flex-col h-screen justify-between"
      variants={page}
      initial="hidden"
      animate="show"
      exit="exit"
    >
      <div className="mx-8 my-4">
        <NavBar />
      </div>
      {currentPersona && showcase ? (
        <>
          <div className="flex flex-col lg:flex-row mb-auto">
            <div className="w-full lg:w-2/3 order-last lg:order-first">
              <UseCaseContainer
                  showcase={showcase}
                  completedUseCaseSlugs={completedUseCaseSlugs}
                  currentPersona={currentPersona}
                  scenarios={scenarios}
              />
              {/*FIXME we need to add support back for revocations*/}
              {/*{revokableCredentials.length > 0 && revocationEnabled && currentPersona.revocationInfo && (*/}
              {/*  <RevocationContainer*/}
              {/*    revocationInfo={currentPersona.revocationInfo}*/}
              {/*    revocationRecord={revokableCredentials}*/}
              {/*  />*/}
              {/*)}*/}
            </div>
            <div className="flex flex-1 flex-col p-2 mx-2 dark:text-white">
              <ProfileCard currentPersona={currentPersona} />
            </div>
          </div>
        </>
      ) : (
        <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
          <Modal title={ERROR_TITLE} description={ERROR_DESCRIPTION} onOk={routeError} />
        </AnimatePresence>
      )}
      {demoCompleted && <DemoCompletedModal action={completeDemo} cancel={cancelCompleteDemo} />}
      <Footer />
    </motion.div>
  )
}
