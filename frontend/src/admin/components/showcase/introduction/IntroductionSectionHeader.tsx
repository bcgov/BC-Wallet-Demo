import { AddConnectionButton } from '../buttons/AddConnectionButton'

interface IntroductionSectionHeaderProps {
  screenId: string
  isFirstConnectScreen: boolean
  hasConnectScreens: boolean
  onSelectCredential: () => void
}

export function IntroductionSectionHeader({
  screenId,
  isFirstConnectScreen,
  hasConnectScreens,
  onSelectCredential,
}: IntroductionSectionHeaderProps) {
  const issueConnectCredentialsHeader = (
    <div className="mt-4 mb-6 flex gap-6 items-start">
      <div className="w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 flex-shrink-0 relative z-10">
        3
      </div>
      <div>
        <h3 className="text-lg font-semibold text-bcgov-black">Issue - Connect and Issue Credentials</h3>
        <h5 className="text-gray-500 mt-2 text-s">
          This section covers the steps for connecting to an issuer and issuing credentials. You currently can't add
          additional custom screens in this section.
        </h5>
      </div>
    </div>
  )

  if (screenId === 'PICK_CHARACTER') {
    return (
      <div className="mt-4 mb-6 flex gap-6 items-center">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
          data-first-circle
        >
          1
        </div>
        <h3 className="text-lg font-semibold text-bcgov-black">Introduce Persona</h3>
      </div>
    )
  }

  if (screenId === 'SETUP_START') {
    return (
      <div className="mt-4 mb-6 flex gap-6 items-center">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
          2
        </div>
        <h3 className="text-lg font-semibold text-bcgov-black">Wallet and General Information</h3>
      </div>
    )
  }

  if (isFirstConnectScreen) {
    return issueConnectCredentialsHeader
  }

  if (screenId === 'SETUP_COMPLETED') {
    return (
      <>
        {!hasConnectScreens && (
          <>
            {issueConnectCredentialsHeader}
            <div className="mb-6">
              <AddConnectionButton onClick={onSelectCredential} />
            </div>
          </>
        )}
        <div className="mt-4 flex gap-6 items-center mb-6">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
            4
          </div>
          <h3 className="text-lg font-semibold text-bcgov-black">Complete</h3>
        </div>
      </>
    )
  }

  return null
}
