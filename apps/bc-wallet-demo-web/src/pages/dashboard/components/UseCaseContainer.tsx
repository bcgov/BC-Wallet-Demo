import React, { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { dashboardTitle, rowContainer } from '../../../FramerAnimations'
import { basePath } from '../../../utils/BasePath'
import { UseCaseItem } from './UseCaseItem'
import { StepActionType } from 'bc-wallet-openapi';
import type { AriesOOBStepAction, Persona, Scenario, Showcase } from '../../../slices/types'
import { getTenantIdFromPath } from '../../../utils/Helpers'

export interface Props {
  showcase: Showcase
  currentPersona: Persona
  completedUseCaseSlugs: string[]
  scenarios: Scenario[]
}

export const UseCaseContainer: FC<Props> = ({ showcase, currentPersona, completedUseCaseSlugs, scenarios }) => {
  const navigate = useNavigate()
  const tenantId = getTenantIdFromPath();
  const startUseCase = (scenarioSlug: string) => {
    navigate(`${basePath}/${tenantId}/${showcase.slug}/${currentPersona.slug}/presentations/${scenarioSlug}`)
  }

  const renderUseCases = scenarios.map(scenario => {
    const isCompleted = completedUseCaseSlugs.includes(scenario.slug)
    const credentialDefinitions = scenario.steps.flatMap(step =>
        step.actions?.filter(action => action.actionType === StepActionType.AriesOob)?.flatMap(action =>
            (action as AriesOOBStepAction).credentialDefinitions ?? []
        ) ?? []
    );

    return (
      <UseCaseItem
        key={scenario.id}
        slug={scenario.slug}
        title={scenario.name}
        requiredCredentials={credentialDefinitions}
        currentPersona={currentPersona}
        start={startUseCase}
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
        {renderUseCases}
      </motion.div>
    </div>
  )
}
