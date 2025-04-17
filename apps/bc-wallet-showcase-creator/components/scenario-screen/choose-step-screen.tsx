'use client'

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { BasicStepAdd } from './basic-step-add'
import { StepType } from '@/types'
import { useEffect } from 'react'
import { createDefaultStep, createServiceStep } from '@/lib/steps'
import { StepActionType } from 'bc-wallet-openapi'

export const CreateScenariosStepsScreen = () => {
  const t = useTranslations()
  const { stepState, activePersonaId, selectedStep, steps, setStepState, setSelectedStep, createStep } = usePresentationAdapter()

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
    if(type == 'HUMAN_TASK'){
      createStep(
        createDefaultStep({
          title: 'Basic Step',
          description: 'This is a basic step in the onboarding journey.',
        })
      )
      setStepState('editing-basic')
    }else if(type == 'SERVICE'){
        createStep(
          createServiceStep({
            title: `Accept your student card`,
            description: `You should have received an offer in BC Wallet for a Student Card. Review what they are sending, and choose 'Accept offer'.`,
            actions: [
              {
                title: "Accept your student card",
                text: 'You should have received an offer in BC Wallet for a Student Card. Review what they are sending, and choose "Accept offer".',
                actionType: StepActionType.ARIES_OOB,
                proofRequest: step.actions[0].proofRequest,
                credentialDefinitionId: step.actions[0].credentialDefinitionId,
              }
            ],
          })
        )
        setStepState('editing-basic')
    }
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
      {activePersonaId && stepState === 'editing-scenario' && <ScenarioEdit />}

    </div>
  )
}
