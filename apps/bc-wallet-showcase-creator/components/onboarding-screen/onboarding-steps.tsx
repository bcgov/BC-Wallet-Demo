'use client'

import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { CreateNewStep } from './create-step'
import { StepEditor } from './step-editor'

export const OnboardingSteps = ({ showcaseSlug }: { showcaseSlug?: string }) => {
  const t = useTranslations()
  const { activePersonaId, stepState, selectedStep, setStepState } = useOnboardingAdapter()

  const renderComponent = () => {
    if (!activePersonaId) {
      return <NoSelection text={t("onboarding.select_persona_message")} />
    }
    
    if (stepState === 'creating-new') {
      return <CreateNewStep />
    }
    
    if (selectedStep !== null) {
      return <StepEditor showcaseSlug={showcaseSlug}/>
    }
    
    return (
      <NoSelection
        text={
          t('onboarding.no_step_selected_message')
        }
        subtext={
          t('onboarding.no_step_selected_subtext')
        }
        handleNewStep={() => setStepState('creating-new')}
        buttonText={t('onboarding.create_new_step_button_label')}
      />
    )
  }

  return (
    <div
      id="editStep"
      className="bg-background text-light-text dark:text-dark-text p-6 rounded-md"
    >
      {renderComponent()}
    </div>
  )
}