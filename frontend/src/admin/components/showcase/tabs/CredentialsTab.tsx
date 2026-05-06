import type { Showcase, Credential, IntroductionStep, ProgressBarStep } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, updateShowcase } from '../../../api/adminApi'
import { CredentialCard } from '../../credential/CredentialCard'

interface CredentialsTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  selectedCredential?: Credential
  onRefresh?: () => void
}

export function CredentialsTab({
  showcase,
  isNewShowcase,
  onTabChange,
  selectedCredential,
  onRefresh,
}: CredentialsTabProps) {
  const auth = useAuth()
  const navigate = useNavigate()

  const initializeBaseIntroduction = async () => {
    if (!isNewShowcase || !showcase || showcase.introduction?.length || !auth.user?.access_token) {
      return
    }

    const introductionScreens: IntroductionStep[] = [
      {
        screenId: 'PICK_CHARACTER',
        name: `Meet ${showcase.persona?.name}`,
        text: `${showcase.name} is a ${showcase.persona?.type}. In this demo, ${showcase.name} will use digital credentials from their BC Wallet to complete various tasks.`,
      },
      {
        screenId: 'SETUP_START',
        name: "Let's get started!",
        text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas.\nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed.',
        image: '/public/common/getStarted.svg',
      },
      {
        screenId: 'CHOOSE_WALLET',
        name: 'Install BC Wallet',
        text: 'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
        image: '/public/common/app-store-screenshots.png',
      },
    ]

    // Add credential-specific screens if selectedCredential is defined
    if (selectedCredential) {
      introductionScreens.push({
        screenId: 'CONNECT',
        name: `Connect to receive credential`,
        text: `Scan the QR code to connect and receive the ${selectedCredential.name} credential.`,
        image: '/public/student/onboarding-connect-light.svg',
        issuer_name: showcase.persona?.name,
      })

      introductionScreens.push({
        screenId: 'ACCEPT_CREDENTIAL',
        name: `Accept your ${selectedCredential.name}`,
        text: `Your wallet now has a connection. You should have received an offer for the ${selectedCredential.name} credential.\nReview what is being sent, and choose 'Accept offer'.`,
        credentials: [selectedCredential],
        image: '/public/common/onboarding-credential-light.svg',
      })
    }

    introductionScreens.push({
      screenId: 'SETUP_COMPLETED',
      name: "You're all set!",
      text: 'Congratulations! You have successfully completed the onboarding. Your credentials are now ready to be used.',
      image: '/public/common/onboarding-completed-light.svg',
    })

    // Create corresponding progress bar
    const progressBar: ProgressBarStep[] = [
      {
        name: 'person',
        introductionStep: 'INTRO_START',
        iconLight: '/public/common/icon-person-light.svg',
        iconDark: '/public/common/icon-person-dark.svg',
      },
      {
        name: 'moon',
        introductionStep: 'SETUP_START',
        iconLight: '/public/common/icon-moon-light.svg',
        iconDark: '/public/common/icon-moon-dark.svg',
      },
    ]

    if (selectedCredential) {
      progressBar.push({
        name: 'wallet',
        introductionStep: 'CHOOSE_WALLET',
        iconLight: '/public/common/icon-wallet-light.svg',
        iconDark: '/public/common/icon-wallet-dark.svg',
      })

      progressBar.push({
        name: 'notification',
        introductionStep: 'ACCEPT_CREDENTIAL',
        iconLight: '/public/common/icon-notification-light.svg',
        iconDark: '/public/common/icon-notification-dark.svg',
      })
    }

    progressBar.push({
      name: 'balloon',
      introductionStep: 'SETUP_COMPLETED',
      iconLight: '/public/common/icon-balloon-light.svg',
      iconDark: '/public/common/icon-balloon-dark.svg',
    })

    try {
      const updates: any = {
        introduction: introductionScreens,
        progressBar: progressBar,
      }

      // Ensure selectedCredential is in root credentials array if present
      if (selectedCredential && !showcase.credentials?.some((c) => c?.id === selectedCredential.id)) {
        updates.credentials = [...(showcase.credentials?.filter((c) => c != null) || []), selectedCredential]
      }

      await updateShowcase(auth, showcase.name, updates)
      onRefresh?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize introduction:', error)
    }
  }

  const handleNextStep = async () => {
    await initializeBaseIntroduction()
    onTabChange?.('introduction')
  }

  const addCredentialToShowcase = async (credential: Credential) => {
    if (!showcase || !auth.user?.access_token) {
      return
    }

    // Check if credential already exists by name, filtering out nulls
    const credentialExists = showcase.credentials?.some((cred) => cred?.name === credential.name)
    if (credentialExists) {
      // eslint-disable-next-line no-console
      console.warn(`Credential "${credential.name}" already exists in showcase`)
      return
    }

    const updatedCredentials = [...(showcase.credentials?.filter((c) => c != null) || []), credential]

    try {
      await updateShowcase(auth, showcase.name, {
        credentials: updatedCredentials,
      })
      onRefresh?.()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to add credential to showcase:', error)
    }
  }

  useEffect(() => {
    // In new showcase flow with onboarding initialization, skip separate add
    // since initializeBaseOnboarding will handle adding the credential
    if (selectedCredential && !(isNewShowcase && !showcase?.introduction?.length)) {
      addCredentialToShowcase(selectedCredential)
    }
    if (selectedCredential && !showcase?.introduction?.length) {
      initializeBaseIntroduction()
    }
  }, [selectedCredential, showcase?.introduction?.length, isNewShowcase])

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
              state: { fromShowcase: true, showcaseName: showcase?.name, isNewShowcase },
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
          {showcase?.credentials
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
