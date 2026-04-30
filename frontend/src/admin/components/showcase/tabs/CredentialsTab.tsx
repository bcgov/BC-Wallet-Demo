import type { CustomCharacter, Credential, OnboardingStep, ProgressBarStep } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, updateCharacter } from '../../../api/adminApi'
import { CredentialCard } from '../../credential/CredentialCard'

interface CredentialsTabProps {
  character: CustomCharacter | null
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  selectedCredential?: Credential
  onRefresh?: () => void
}

export function CredentialsTab({
  character,
  isNewShowcase,
  onTabChange,
  selectedCredential,
  onRefresh,
}: CredentialsTabProps) {
  const auth = useAuth()
  const navigate = useNavigate()

  const initializeBaseOnboarding = async () => {
    if (!isNewShowcase || !character || character.onboarding?.length || !auth.user?.access_token) {
      return
    }

    const baseOnboarding: OnboardingStep[] = [
      {
        screenId: 'INTRO_START',
        title: `Meet ${character.name}`,
        text: `${character.name} is a ${character.type}. In this demo, ${character.name} will use digital credentials from their BC Wallet to complete various tasks.`,
      },
      {
        screenId: 'SETUP_START',
        title: "Let's get started!",
        text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas.\nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed.',
      },
    ]

    // Add credential-specific screens if selectedCredential is defined
    if (selectedCredential) {
      baseOnboarding.push({
        screenId: 'CONNECT',
        title: `Connect to receive credential`,
        text: `Scan the QR code to connect and receive the ${selectedCredential.name} credential.`,
        issuer_name: character.name,
      })

      baseOnboarding.push({
        screenId: 'ACCEPT_CREDENTIAL',
        title: `Accept your ${selectedCredential.name}`,
        text: `Your wallet now has a connection. You should have received an offer for the ${selectedCredential.name} credential.\nReview what is being sent, and choose 'Accept offer'.`,
        credentials: [selectedCredential],
      })
    }

    baseOnboarding.push({
      screenId: 'SETUP_COMPLETED',
      title: "You're all set!",
      text: 'Congratulations! You have successfully completed the onboarding. Your credentials are now ready to be used.',
    })

    // Create corresponding progress bar
    const progressBar: ProgressBarStep[] = [
      {
        name: 'person',
        onboardingStep: 'INTRO_START',
        iconLight: '/public/common/icon-person-light.svg',
        iconDark: '/public/common/icon-person-dark.svg',
      },
      {
        name: 'moon',
        onboardingStep: 'SETUP_START',
        iconLight: '/public/common/icon-moon-light.svg',
        iconDark: '/public/common/icon-moon-dark.svg',
      },
    ]

    if (selectedCredential) {
      progressBar.push({
        name: 'wallet',
        onboardingStep: 'CONNECT',
        iconLight: '/public/common/icon-wallet-light.svg',
        iconDark: '/public/common/icon-wallet-dark.svg',
      })

      progressBar.push({
        name: 'notification',
        onboardingStep: 'ACCEPT_CREDENTIAL',
        iconLight: '/public/common/icon-notification-light.svg',
        iconDark: '/public/common/icon-notification-dark.svg',
      })
    }

    progressBar.push({
      name: 'balloon',
      onboardingStep: 'SETUP_COMPLETED',
      iconLight: '/public/common/icon-balloon-light.svg',
      iconDark: '/public/common/icon-balloon-dark.svg',
    })

    try {
      await updateCharacter(auth, character.name, {
        onboarding: baseOnboarding,
        progressBar: progressBar,
      })
      onRefresh?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize onboarding:', error)
    }
  }

  const handleNextStep = async () => {
    await initializeBaseOnboarding()
    onTabChange?.('introduction')
  }

  const addCredentialToCharacter = async (credential: Credential) => {
    if (!character || !auth.user?.access_token) {
      return
    }

    // Check if credential already exists by name, filtering out nulls
    const credentialExists = character.credentials?.some((cred) => cred?.name === credential.name)
    if (credentialExists) {
      // eslint-disable-next-line no-console
      console.warn(`Credential "${credential.name}" already exists in character`)
      return
    }

    const updatedCredentials = [...(character.credentials?.filter((c) => c != null) || []), credential]

    try {
      await updateCharacter(auth, character.name, {
        credentials: updatedCredentials,
      })
      onRefresh?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add credential to character:', error)
    }
  }

  useEffect(() => {
    if (selectedCredential) {
      addCredentialToCharacter(selectedCredential)
    }
    if (selectedCredential && !character?.onboarding?.length) {
      initializeBaseOnboarding()
    }
  }, [selectedCredential, character?.onboarding?.length])

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Credentials Tab */}
      <div className="w-full max-w-6xl mb-8 px-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-bcgov-black">Credentials</h2>
          <h5 className="text-gray-500 mt-2">
            Manage credential configurations for this showcase. These will be displayed as issuance QR codes during the
            Introduction.
          </h5>
        </div>
        <button
          onClick={() =>
            navigate(`${adminBaseRoute}/creator/credentials`, {
              state: { fromShowcase: true, characterName: character?.name, isNewShowcase },
            })
          }
          className="flex items-center gap-2 px-4 py-2 bg-bcgov-blue text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Add Credential
        </button>
      </div>
      <div className="w-full max-w-6xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {character?.credentials
            ?.filter((credential) => credential != null)
            .map((credential, idx) => (
              <CredentialCard key={idx} credential={credential} />
            ))}
        </div>
      </div>
      {isNewShowcase && (
        <div className="w-full max-w-6xl mt-8 px-6 flex justify-center">
          <button
            onClick={handleNextStep}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Next Step
          </button>
        </div>
      )}
    </div>
  )
}
