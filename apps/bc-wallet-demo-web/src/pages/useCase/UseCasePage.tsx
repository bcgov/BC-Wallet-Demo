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
import { useCurrentPersona } from '../../slices/showcases/showcasesSelectors'
import type { CustomUseCase } from '../../slices/types'
import { useUseCaseState } from '../../slices/useCases/useCasesSelectors'
import { nextSection } from '../../slices/useCases/useCasesSlice'
import { basePath } from '../../utils/BasePath'
import { Section } from './Section'

export const UseCasePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { slug } = useParams()
  const { stepCount, sectionCount, isLoading } = useUseCaseState()
  const currentCharacter = useCurrentPersona()
  const { section } = useSection()
  const connection = useConnection()
  const { issuedCredentials } = useCredentials()
  const { proof, proofUrl } = useProof()
  const [currentUseCase, setCurrentUseCase] = useState<CustomUseCase>()

  const navigate = useNavigate()
  useTitle(`${currentUseCase?.name ?? 'Use case'} | BC Wallet Self-Sovereign Identity Demo`)

  /*
  useEffect(() => {
    if (currentCharacter && slug) {
      setCurrentUseCase(currentCharacter.useCases.find((item: any) => item.id === slug))
    }
  }, [])
*/

  useEffect(() => {
    if (currentUseCase) {
      const steps = currentUseCase.screens
      // check if the next section contains a connection step, if not: keep the current connection in state to use for next section
      const newConnection = currentUseCase.screens[sectionCount + 1]?.screenId.startsWith('CONNECTION')

      if (steps.length === stepCount) {
        dispatch(nextSection())
        dispatch(clearProof())
        dispatch(clearCredentials())
        if (newConnection) dispatch(clearConnection())
      }
    }
  }, [currentUseCase, stepCount, sectionCount])

  useEffect(() => {
    if (currentUseCase?.id) {
      dispatch(setSection(currentUseCase.screens[sectionCount]))
    }
  }, [currentUseCase, sectionCount])

  useEffect(() => {
    trackPageView()
  }, [])

  const ERROR_TITLE = `Woops...`
  const ERROR_DESCRIPTION = `You haven't picked your character yet. Please restart the demo.`
  const routeError = () => {
    navigate(`${basePath}/demo`)
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
          {currentCharacter && section && currentUseCase ? (
            <motion.div
              key={'sectionDiv' + section.screenId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ when: 'afterChildren' }}
              exit={{ opacity: 0 }}
              className="h-full pb-16"
            >
              <Section
                key={section.screenId}
                section={currentUseCase.screens}
                connection={connection}
                sectionCount={sectionCount}
                stepCount={stepCount}
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
