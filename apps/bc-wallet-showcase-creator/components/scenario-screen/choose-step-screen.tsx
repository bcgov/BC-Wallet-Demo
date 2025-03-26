'use client'

// import { IssuanceStepAdd } from "./issue-step-edit";
// import { CreateNewStep } from "./create-step";

import { BasicStepEdit } from '@/components/scenario-screen/basic-step-edit'
import { ChooseStepType } from '@/components/scenario-screen/choose-step-type'
import { ProofStepEdit } from '@/components/scenario-screen/proof-step-edit'
import { ScenarioEdit } from '@/components/scenario-screen/scenario-edit'
import { usePresentationAdapter } from '@/hooks/use-presentation-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { BasicStepAdd } from './basic-step-add'
import { StepType } from '@/types'

export const CreateScenariosStepsScreen = () => {
  const t = useTranslations()
  const { stepState, activePersonaId } = usePresentationAdapter()

  const handleAddStep = (type: StepType) => {
    // if (selectedScenario === null) return
    // const newStep = createEmptyStep(type)
    // addStep(selectedScenario, newStep)
  }
  
  return (
    <div
      id="editStep"
      className=" bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text p-6 rounded-md"
    >
      {JSON.stringify(stepState)}
      {stepState === 'editing-scenario' && <ScenarioEdit />}

      {!activePersonaId && (
        <NoSelection
          text={
            // t("onboarding.select_persona_message") ||
            'Please select a persona from the left to edit their onboarding steps.'
          }
        />
      )}
      {activePersonaId && (stepState === null || stepState === 'no-selection') && (
        <NoSelection
          text={
            t('onboarding.no_step_selected_message') ||
            'No step selected. Please select a step from the left panel or create a new one.'
          }
        />
      )}
      {activePersonaId && stepState === 'creating-new' && <ChooseStepType addNewStep={() => {}} />}
      {activePersonaId && stepState === 'editing-basic' && <BasicStepAdd />}
      {activePersonaId && stepState === 'editing-issue' && <BasicStepEdit />}


      {/* LEGACY VERSION */}
      {stepState === 'adding-step' && <ChooseStepType addNewStep={handleAddStep} />}

      {stepState === 'editing-scenario' && <ScenarioEdit />}

      {stepState === 'basic-step-edit' && currentStep?.type === 'HUMAN_TASK' && <BasicStepEdit />}

      {stepState === 'proof-step-edit' && currentStep?.type === 'CONNET_AND_VERIFY' && <ProofStepEdit />}

      {(stepState === 'none-selected' || stepState === null) && (
        <NoSelection text={t('scenario.no_scenario_selected_message')} />
      )}
    </div>
  )
}
