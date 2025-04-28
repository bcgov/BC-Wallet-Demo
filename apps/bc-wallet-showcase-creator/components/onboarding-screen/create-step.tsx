'use client'

import { Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import StepHeader from '../step-header'
import { createDefaultStep, createAdvancedStep } from '@/lib/steps'
import { useOnboardingAdapter } from '@/hooks/use-onboarding-adapter'
import StepButton from './step-button'
import { 
  StepActionType, 
  AcceptCredentialActionRequest, 
  ChooseWalletActionRequest,
  SetupConnectionActionRequest,
  StepType
} from 'bc-wallet-openapi'

export const CreateNewStep = () => {
  const { createStep, activePersona } = useOnboardingAdapter()
  const t = useTranslations()

  const handleAddStep = (stepType: string) => {
    const personaName = activePersona?.name || 'Character'

    switch (stepType) {
      case 'issue':
        createStep(
          createAdvancedStep({
            title: `Accept your student card`,
            description: `You should have received an offer in BC Wallet for a Student Card. Review what they are sending, and choose 'Accept offer'.`,
            actions: [{
              title: "Accept Credential",
              actionType: StepActionType.AcceptCredential,
              text: "Accept this credential",
              credentialDefinitionId: "",
            } as AcceptCredentialActionRequest],
            type: StepType.Service,
          })
        )
        break

      case 'basic':
        createStep(
          createDefaultStep({
            title: 'Basic Step',
            description: 'This is a basic step in the onboarding journey.',
            asset: "",
          })
        )
        break

      case 'wallet':
        createStep(
          createAdvancedStep({
            title: 'Install BC Wallet',
            description: "First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.",
            actions: [{
              title: "Choose a Wallet",
              actionType: StepActionType.ChooseWallet,
              text: "Select a wallet to use",
            } as ChooseWalletActionRequest]
          })
        )
        break

      case 'connect':
        createStep(
          createAdvancedStep({
            title: 'Connect with BC College',
            description: `Imagine, as ${personaName}, you are logged into the BestBC College website (see below). They want to offer you a Digital Student Card. Use your BC Wallet to scan the QR code from the website.`,
            asset: "",
            actions: [{
              title: "Connect Wallet",
              actionType: StepActionType.SetupConnection,
              text: "Scan this QR code with your wallet to connect",
            } as SetupConnectionActionRequest]
          })
        )
        break

      default:
        break
    }
  }

  return (
    <>
      <StepHeader
        icon={<Monitor strokeWidth={3} />}
        title={t('scenario.add_step_label') || 'Add Step'}
        showDropdown={false}
      />

      <StepButton
        title={t('onboarding.create_basic_step_label') || 'Basic Step'}
        details={[
          t('onboarding.create_title_label') || 'Title',
          t('onboarding.create_description_label') || 'Description',
          t('onboarding.create_image_label') || 'Image',
        ]}
        onClick={() => handleAddStep('basic')}
      />

      <StepButton
        title={t('onboarding.create_issue_step_label') || 'Issue Step'}
        details={[
          t('onboarding.create_title_label') || 'Title',
          t('onboarding.create_description_label') || 'Description',
          t('onboarding.create_image_label') || 'Image',
          t('onboarding.create_credentials_label') || 'Credential(s)',
        ]}
        onClick={() => handleAddStep('issue')}
      />

      <StepButton
        title={t('onboarding.install_wallet_step_label') || 'Install Wallet Step'}
        details={[
          t('onboarding.create_title_label') || 'Title',
          t('onboarding.create_description_label') || 'Description',
          t('onboarding.create_image_label') || 'Image',
          t('onboarding.install_wallet_label') || 'Wallet',
        ]}
        onClick={() => handleAddStep('wallet')}
      />

      <StepButton
        title={t('onboarding.connect_step_label') || 'Connect Step'}
        details={[
          t('onboarding.create_title_label') || 'Title',
          t('onboarding.create_description_label') || 'Description',
          t('onboarding.create_image_label') || 'Image',
          'QR Code',
        ]}
        onClick={() => handleAddStep('connect')}
      />
    </>
  )
}