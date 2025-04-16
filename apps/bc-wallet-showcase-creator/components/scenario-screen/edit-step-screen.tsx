'use client'

import { useEffect } from 'react'

import { NoSelection } from '@/components/credentials/no-selection'
import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ProofStepEdit } from '@/components/scenario-screen/proof-step-edit'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { useScenarios } from '@/hooks/use-scenarios'
import { createEmptyStep } from '@/hooks/use-scenarios'
import { useShowcaseStore } from '@/hooks/use-showcase-store'
import { StepType } from '@/types'
import { useTranslations } from 'next-intl'

export const EditStepScreen = () => {
  const t = useTranslations()
  const { showcaseJSON, selectedCharacter } = useShowcaseStore()
  const { scenarios, selectedScenario, selectedStep, stepState, setScenarios, addStep } = useScenarios()
  console.log('scenarios in Edit Step', scenarios)
  useEffect(() => {
    setScenarios(scenarios)
  }, [selectedCharacter, showcaseJSON.personas])
  console.log('selectedScenario in Edit Step', selectedScenario)
  const currentScenario = selectedScenario !== null ? scenarios[selectedScenario] : null
  console.log('currentScenario in Edit', currentScenario)
  console.log('selectedStep in Edit', selectedStep)
  const currentStep = currentScenario && selectedStep !== null ? currentScenario.steps[selectedStep] : null

  console.log('currentStepcurrentStep', currentStep)
  const handleAddStep = (type: StepType) => {
    if (selectedScenario === null) return
    const newStep = createEmptyStep(type)
    addStep(selectedScenario, newStep)
  }

  return (
    <div className="w-full bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text p-6 rounded-md right-col">
      {stepState === 'adding-step' && <ChooseStepType addNewStep={handleAddStep} />}

      {stepState === 'editing-scenario' && <ScenarioEdit />}

      {stepState === 'basic-step-edit' && currentStep?.type === StepType.HUMAN_TASK && <BasicStepEdit />}

      {stepState === 'proof-step-edit' && currentStep?.type === StepType.SERVICE && <ProofStepEdit />}

      {(stepState === 'none-selected' || stepState === null) && (
        <NoSelection text={t('scenario.no_scenario_selected_message')} />
      )}
    </div>
  )
}
