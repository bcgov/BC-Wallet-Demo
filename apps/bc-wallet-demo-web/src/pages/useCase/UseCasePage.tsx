import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { trackPageView } from '@snowplow/browser-tracker'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader } from '../../components/Loader'
import { Modal } from '../../components/Modal'
import { page } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useTitle } from '../../hooks/useTitle'
import { useConnection } from '../../slices/connection/connectionSelectors'
import { clearConnection } from '../../slices/connection/connectionSlice'
import { useCredentials } from '../../slices/credentials/credentialsSelectors'
import { clearCredentials } from '../../slices/credentials/credentialsSlice'
import { useProof } from '../../slices/proof/proofSelectors'
import { clearProof } from '../../slices/proof/proofSlice'
import { useSection } from '../../slices/section/sectionSelectors'
import { setSection } from '../../slices/section/sectionSlice'
import {useCurrentPersona, useShowcases} from '../../slices/showcases/showcasesSelectors'
import { useUseCaseState } from '../../slices/useCases/useCasesSelectors'
//import { nextSection } from '../../slices/useCases/useCasesSlice'
import { basePath } from '../../utils/BasePath'
import { Section } from './Section'
import type {CustomUseCase, Scenario} from '../../slices/types'
import {fetchPersonaBySlug, fetchScenarioBySlug, fetchShowcaseBySlug} from '../../slices/showcases/showcasesThunks';
import {usePersonaSlug, useScenarioSlug, useSlug} from '../../utils/SlugUtils';
import {PageNotFound} from '../PageNotFound';

export const UseCasePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { slug } = useParams()
  const { stepCount, isLoading } = useUseCaseState()
  // const currentCharacter = useCurrentPersona()
  const { showcase, currentPersona, currentScenario } = useShowcases()
  const { section } = useSection()
  const connection = useConnection()
  const { issuedCredentials } = useCredentials()
  const { proof, proofUrl } = useProof()
  //const [currentUseCase, setCurrentUseCase] = useState<CustomUseCase>()
  const showcaseSlug = useSlug()
  const personaSlug = usePersonaSlug()
  const scenarioSlug = useScenarioSlug()
  const [scenario, setScenario] = useState<Scenario>()

  const navigate = useNavigate()
  useTitle(`${scenario?.name ?? 'Use case'} | BC Wallet Self-Sovereign Identity Demo`)

  // useEffect(() => {
  //   if (scenario) {
  //     const steps = currentUseCase.screens
  //     // check if the next section contains a connection step, if not: keep the current connection in state to use for next section
  //     const newConnection = currentUseCase.screens[sectionCount + 1]?.screenId.startsWith('CONNECTION')
  //
  //     if (steps.length === stepCount) {
  //       dispatch(nextSection())
  //       dispatch(clearProof())
  //       dispatch(clearCredentials())
  //       if (newConnection) dispatch(clearConnection())
  //     }
  //   }
  // }, [scenario, stepCount, sectionCount])

  // useEffect(() => {
  //   if (currentUseCase?.id) {
  //     dispatch(setSection(currentUseCase.screens[sectionCount]))
  //   }
  // }, [scenario, sectionCount])

  useEffect(() => {
    trackPageView()
  }, [])

  useEffect(() => {
    const load = async () => {
      await dispatch(fetchShowcaseBySlug(showcaseSlug))
      await dispatch(fetchPersonaBySlug(personaSlug))
      await dispatch(fetchScenarioBySlug(scenarioSlug))
    }
    void load()
  }, [dispatch, showcaseSlug, personaSlug, scenarioSlug])

  if (showcase === undefined || currentPersona === undefined || currentScenario === undefined) {
    return <div>Loading...</div>
  }

  if (showcase === null) {
    return <PageNotFound resourceType="Showcase" resourceName={showcaseSlug} />
  }

  if (currentPersona === null) {
    return <PageNotFound resourceType="Persona" resourceName={personaSlug} />
  }

  if (currentScenario === null) {
    return <PageNotFound resourceType="Scenario" resourceName={scenarioSlug} />
  }

  const ERROR_TITLE = `Woops...`
  const ERROR_DESCRIPTION = `That's not gone well. Please restart the demo.`
  const routeError = () => {
    navigate(`${basePath}/`)
  }

  return (
    <motion.div
      variants={page}
      initial="hidden"
      animate="show"
      exit="exit"
      className="container flex flex-col h-auto lg:h-screen p-4 lg:p-6 xl:p-8 dark:text-white"
    >
      {isLoading ? (
        <div className="m-auto">
          <Loader />
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {showcase && currentPersona && currentScenario ? ( // && section && currentUseCase
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ when: 'afterChildren' }}
              exit={{ opacity: 0 }}
              className="h-full pb-16"
            >
              <Section
                showcase={showcase}
                currentPersona={currentPersona}
                currentScenario={currentScenario}
                connection={connection}
                credentials={issuedCredentials}
                proof={proof}
              />
            </motion.div>
          ) : (
            <Modal key="errorModal" title={ERROR_TITLE} description={ERROR_DESCRIPTION} onOk={routeError} />
          )}
        </AnimatePresence>
      )}
    </motion.div>
  )
}
