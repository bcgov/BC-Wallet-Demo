'use client'

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { StepType } from 'bc-wallet-openapi'
import { createDefaultStep, createAdvancedStep } from '@/lib/steps'

export const CreateScenariosStepsScreen = ({ slug }: { slug?: string }) => {
  const t = useTranslations()
  const { stepState, activePersonaId, setStepState, createStep } = usePresentationAdapter()

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
            title: `Confirm the information to send`,
            description: `BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has not expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.`,
            actions: [
              {
                title: "Confirm the information to send",
                text: `BC Wallet will now ask you to confirm what to send. Notice how it will only share if the credential has not expired, not even the expiry date itself gets shared. You don't have to share anything else for it to be trustable.`,
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
      className="bg-background text-light-text dark:text-dark-text p-6 rounded-md"
    >
      {!activePersonaId && <NoSelection text={t('onboarding.select_persona_message')} />}
      {activePersonaId && stepState === 'no-selection' && (
        <NoSelection
          text={
            t('onboarding.no_step_selected_message')
          }
        />
      )}
      {activePersonaId && stepState === 'creating-new' && <ChooseStepType addNewStep={handleAddStep} />}
      {activePersonaId && stepState === 'editing-basic' && <BasicStepEdit slug={slug} />}
      {activePersonaId && stepState === 'editing-scenario' && <ScenarioEdit slug={slug} />}
    </div>
  )
}
