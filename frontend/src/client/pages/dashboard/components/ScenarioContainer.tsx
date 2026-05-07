import type { Showcase } from '../../../slices/types'

import { motion } from 'framer-motion'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { dashboardTitle, rowContainer } from '../../../FramerAnimations'
import { basePath } from '../../../utils/BasePath'

import { ScenarioItem } from './ScenarioItem'

export interface Props {
  currentShowcase: Showcase
  completedScenarioSlugs: string[]
  issuedCredentials: string[]
}

export const ScenarioContainer: React.FC<Props> = ({ currentShowcase, completedScenarioSlugs }) => {
  const navigate = useNavigate()

  const startScenario = (slug: string) => {
    navigate(`${basePath}/uc/${slug}`)
  }

  const renderScenarios = currentShowcase.scenarios.map((item) => {
    const requiredCredentials: string[] = []
    // item.screens.forEach(screen => requiredCredentials.push(...(screen.requestOptions?.requestedCredentials.map(item => item.name) ?? [])))
    item.screens.forEach((screen) =>
      screen.requestOptions?.requestedCredentials.forEach((cred) => {
        if (!requiredCredentials.includes(cred.name)) {
          requiredCredentials.push(cred.name)
        }
      }),
    )

    const isCompleted = completedScenarioSlugs.includes(item.id)

    return (
      <ScenarioItem
        key={item.id}
        slug={item.id}
        title={item.name}
        requiredCredentials={requiredCredentials}
        currentShowcase={currentShowcase}
        start={startScenario}
        isLocked={false}
        isCompleted={isCompleted}
      />
    )
  })

  return (
    <div className="flex flex-col mx-4 lg:mx-4 my-2 p-4 md:p-6 lg:p-8 bg-white dark:bg-bcgov-darkgrey dark:text-white rounded-lg shadow-sm">
      <motion.h1 variants={dashboardTitle} className="text-3xl md:text-4xl font-bold mb-2">
        Using your credentials
      </motion.h1>
      <motion.div variants={rowContainer} className="flex flex-col w-auto overflow-x-hidden md:overflow-x-visible">
        {renderScenarios}
      </motion.div>
    </div>
  )
}
