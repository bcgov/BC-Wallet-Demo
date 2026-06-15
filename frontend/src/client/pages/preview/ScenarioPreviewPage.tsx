import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useBeforeUnload, useSearchParams } from 'react-router-dom'

import { dashboardTitle, page, rowContainer } from '../../FramerAnimations'
import { useAppDispatch } from '../../hooks/hooks'
import { useShowcases } from '../../slices/showcases/showcasesSelectors'
import { fetchAllShowcases } from '../../slices/showcases/showcasesThunks'
import { ProfileCard } from '../dashboard/components/ProfileCard'
import { ScenarioItem } from '../dashboard/components/ScenarioItem'
import { NavBar } from '../landing/components/Navbar'
import { ScenarioPage } from '../scenario/Scenario'

export const ScenarioPreviewPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const previewShowcaseName = searchParams.get('showcase') || undefined
  const [activeScenario, setActiveScenario] = useState<string | undefined>(undefined)
  const { showcases } = useShowcases()
  const dispatch = useAppDispatch()

  useBeforeUnload(() => {
    dispatch({ type: 'demo/RESET' })
  })

  useEffect(() => {
    dispatch(fetchAllShowcases())
  }, [dispatch, showcases.length])

  const previewShowcase = showcases.find((showcase) => !previewShowcaseName || showcase.name === previewShowcaseName)

  if (!previewShowcase) {
    return <div>Loading...</div>
  }

  const startScenario = (slug: string) => {
    setActiveScenario(slug)
  }

  const renderScenarios = previewShowcase.scenarios.map((item) => {
    const requiredCredentials: string[] = []
    item.screens.forEach((screen) =>
      screen.requestOptions?.requestedCredentials.forEach((cred) => {
        if (!requiredCredentials.includes(cred.name)) {
          requiredCredentials.push(cred.name)
        }
      }),
    )

    return (
      <ScenarioItem
        key={item.id}
        slug={item.id}
        title={item.name}
        requiredCredentials={requiredCredentials}
        currentShowcase={previewShowcase}
        start={startScenario}
        isLocked={false}
        isCompleted={false}
      />
    )
  })

  return (
    <>
      {!activeScenario && (
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
          <div className="flex flex-col lg:flex-row mb-auto">
            <div className="w-full lg:w-2/3 order-last lg:order-first">
              <div className="flex flex-col mx-4 lg:mx-4 my-2 p-4 md:p-6 lg:p-8 bg-white dark:bg-bcgov-darkgrey dark:text-white rounded-lg shadow-sm">
                <motion.h1 variants={dashboardTitle} className="text-3xl md:text-4xl font-bold mb-2">
                  Using your credentials
                </motion.h1>
                <motion.div
                  variants={rowContainer}
                  className="flex flex-col w-auto overflow-x-hidden md:overflow-x-visible"
                >
                  {renderScenarios}
                </motion.div>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-2 mx-2 dark:text-white">
              <ProfileCard currentShowcase={previewShowcase} />
            </div>
          </div>
        </motion.div>
      )}

      {activeScenario && <ScenarioPage propCurrentShowcase={previewShowcase} propSlug={activeScenario} />}
    </>
  )
}
