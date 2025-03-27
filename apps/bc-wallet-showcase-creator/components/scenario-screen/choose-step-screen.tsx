'use client'

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ProofStepEdit } from '@/components/scenario-screen/proof-step-edit'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { BasicStepAdd } from './basic-step-add'
import { StepType } from '@/types'
import { useEffect } from 'react'

export const CreateScenariosStepsScreen = () => {
  const t = useTranslations()
  const { stepState, activePersonaId, selectedStep, steps, setStepState, setSelectedStep } = usePresentationAdapter()

  // Get the current step if available
  const currentStep = selectedStep !== null && steps.length > selectedStep.stepIndex ? steps[selectedStep.stepIndex] : null

  // Debugging output - remove in production
  useEffect(() => {
    console.log('Step state changed:', {
      stepState,
      selectedStep,
      activePersonaId,
      currentStep: currentStep
        ? {
            type: currentStep.type,
            title: currentStep.title,
          }
        : null,
    })
  }, [stepState, selectedStep, activePersonaId, currentStep])

  // In CreateScenariosStepsScreen.jsx
  useEffect(() => {
    console.log('Component re-rendered with stepState:', stepState)
  }, [stepState])

  const handleAddStep = (type: StepType) => {
    // Implement this if needed
  }

  return (
    <div
      id="editStep"
      className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text p-6 rounded-md"
    >
      {/* Simplified, consistent rendering based on stepState */}
      {!activePersonaId && <NoSelection text={t('onboarding.select_persona_message')} />}

      {activePersonaId && stepState === 'no-selection' && (
        <NoSelection
          text={
            t('onboarding.no_step_selected_message') ||
            'No step selected. Please select a step from the left panel or create a new one.'
          }
        />
      )}

      {activePersonaId && stepState === 'creating-new' && <ChooseStepType addNewStep={handleAddStep} />}

      {activePersonaId && stepState === 'editing-basic' && <BasicStepEdit />}

      {activePersonaId && stepState === 'editing-issue' && <ProofStepEdit />}

      {activePersonaId && stepState === 'editing-scenario' && <ScenarioEdit />}

      {/* Debug output - remove in production */}
      <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs">
        <div>Step State: {JSON.stringify(stepState)}</div>
        <div>Selected Step: {JSON.stringify(selectedStep)}</div>
        <div>Active Persona: {JSON.stringify(activePersonaId)}</div>
      </div>

      {/* <div className="mt-4">
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setStepState('editing-basic')}>
          Test: Set to Editing Basic
        </button>
      </div> */}

      <div className="mt-4 flex space-x-2">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => {
            console.log('Test select step 0')
            setSelectedStep({ stepIndex: 0, scenarioIndex: 0 })
            setStepState('editing-basic')
          }}
        >
          Test: Select Step 0
        </button>

        <button
          className="bg-yellow-500 text-white px-4 py-2 rounded"
          onClick={() => {
            console.log('Test select step 1')
            setSelectedStep({ stepIndex: 1, scenarioIndex: 0 })
            setStepState('editing-issue')
          }}
        >
          Test: Select Step 1
        </button>
      </div>
    </div>
  )
}
