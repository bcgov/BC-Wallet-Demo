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
          'This section includes multiple steps for your character onboarding. Please note that you will configure onboarding steps for each of your characters'
        }
        subtext={
          'First, you will click on each step to review and configure the default onboarding details already included in your showcase.'
        }
        subtext1=' Next, you may add any additional steps you would like to include in the character onboarding by clicking ‘Add Step’ at the bottom of the list’'
        subtext2='Note: If you have more than one character, please click on each character and configure the onboarding steps.'
        // handleNewStep={() => setStepState('creating-new')}
        // buttonText={t('onboarding.create_new_step_button_label')}
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