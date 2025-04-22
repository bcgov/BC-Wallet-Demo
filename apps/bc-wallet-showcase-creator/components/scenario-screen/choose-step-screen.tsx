'use client'

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { StepType } from 'bc-wallet-openapi'
import { useEffect } from 'react'
import { createDefaultStep, createAdvancedStep } from '@/lib/steps'

export const CreateScenariosStepsScreen = () => {
  const t = useTranslations()
  const { stepState, activePersonaId, setStepState, createStep } = usePresentationAdapter()

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
          createAdvancedStep({
            title: `Accept your student card`,
            description: `You should have received an offer in BC Wallet for a Student Card. Review what they are sending, and choose 'Accept offer'.`,
            actions: [
              {
                title: "Accept your student card",
                text: 'You should have received an offer in BC Wallet for a Student Card. Review what they are sending, and choose "Accept offer".',
                actionType: 'ARIES_OOB',
                proofRequest: {
                  attributes:{},
                  predicates:{},
                },
                credentialDefinitionId: '',
              }
            ],
          })
        )
        setStepState('editing-basic')
    }
  }

  return (
    <div
      id="editStep"
      className="bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text p-6 rounded-md"
    >
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
