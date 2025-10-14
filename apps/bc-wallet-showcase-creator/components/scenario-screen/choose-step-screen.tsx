'use client'

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { AriesOOBActionRequest, StepType } from 'bc-wallet-openapi'
import { createDefaultStep, createAdvancedStep } from '@/lib/steps'

export const CreateScenariosStepsScreen = ({ slug }: { slug?: string }) => {
  const t = useTranslations()
  const { stepState, activePersonaId, setStepState, createStep } = usePresentationAdapter(slug)

  const sampleAction: AriesOOBActionRequest =  {
    title: "example_title",
    actionType: "ARIES_OOB" as "ARIES_OOB",
    text: "example_text",
    proofRequest: {
      attributes: {},
      predicates: {},
    },
    credentialDefinitionId: ""
  }

  const handleAddStep = (type: StepType) => {
    if(type == 'HUMAN_TASK'){
      createStep(
        createDefaultStep({
          title: 'Basic Step',
          description: 'This is a basic step in the onboarding journey.',
          actions: [sampleAction]
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
          text={'This section includes multiple steps to create the scenarios included in your showcase. Please note that you will configure scenarios for each of your characters and then you will configure the steps included in each scenario.'}
          subtext='First, you will click on each scenario step to review and configure the default scenario details already included in your showcase.' 
          subtext1='Next, you may add and configure those steps required to verify credentials held by each character. You can add additional steps to the default scenario already created by clicking ‘Add Step’. You may also copy and create a new scenario and corresponding steps for each of your characters.'
          subtext2='Note: If you have more than one character, please click on each character and configure both the scenarios and scenario steps.'
        />
      )}
      {activePersonaId && stepState === 'creating-new' && <ChooseStepType addNewStep={handleAddStep} />}
      {activePersonaId && stepState === 'editing-basic' && <BasicStepEdit slug={slug} />}
      {activePersonaId && stepState === 'editing-scenario' && <ScenarioEdit slug={slug} />}
    </div>
  )
}
