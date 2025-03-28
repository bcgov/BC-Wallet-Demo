'use client'

import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import { useTranslations } from 'next-intl'

import { NoSelection } from '../credentials/no-selection'
import { BasicStepAdd } from './basic-step-add'
import { CreateNewStep } from './create-step'
import { IssuanceStepAdd } from './issue-step-edit'
import { WalletStepEdit } from './wallet-step-edit'
import { ConnectStepEdit } from './connect-step-edit'

export const OnboardingSteps = () => {
  const t = useTranslations()
  const { stepState, activePersonaId } = useOnboardingAdapter()

  return (
    <div
      id="editStep"
      className=" bg-white dark:bg-dark-bg-secondary text-light-text dark:text-dark-text p-6 rounded-md"
    >
      {!activePersonaId && (
        <NoSelection
          text={
            t("onboarding.select_persona_message")
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
      {activePersonaId && stepState === 'creating-new' && <CreateNewStep />}
      {activePersonaId && stepState === 'editing-basic' && <BasicStepAdd />}
      {activePersonaId && stepState === 'editing-connect' && <ConnectStepEdit />}
      {activePersonaId && stepState === 'editing-wallet' && <WalletStepEdit />}
      {activePersonaId && stepState === 'editing-issue' && <IssuanceStepAdd />}
    </div>
  )
}
