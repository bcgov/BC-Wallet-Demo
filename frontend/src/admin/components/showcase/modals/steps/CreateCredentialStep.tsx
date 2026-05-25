import type { Credential, Showcase } from '../../../../types'

import { publicBaseUrl } from '../../../../api/adminApi'

interface CreateCredentialStepProps {
  showcase: Showcase | null | undefined
  selectedCredentials: Set<string>
  onSelectCredential: (credentialId: string, checked: boolean) => void
  onBack: () => void
  onContinue: () => void
}

export function CreateCredentialStep({
  showcase,
  selectedCredentials,
  onSelectCredential,
  onBack,
  onContinue,
}: CreateCredentialStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-bcgov-black mb-3">Select Credentials to Request</h3>
        <p className="text-xs text-gray-500 mb-4">
          Choose which credentials users will need to share during this verification process.
        </p>
      </div>

      {showcase?.credentials && showcase.credentials.length > 0 ? (
        <div className="space-y-2">
          {showcase.credentials.map((credential: Credential) => (
            <label
              key={credential.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCredentials.has(credential.id)}
                onChange={(e) => onSelectCredential(credential.id, e.target.checked)}
                className="w-4 h-4 text-bcgov-blue border-gray-300 rounded focus:ring-2 focus:ring-bcgov-blue"
              />
              <div className="flex items-center gap-3 flex-1">
                {credential.icon && (
                  <img
                    src={`${publicBaseUrl}${credential.icon}`}
                    alt={credential.name}
                    className="w-8 h-8 object-contain"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-bcgov-black">{credential.name}</p>
                  <p className="text-xs text-gray-500">v{credential.version}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No credentials available in this showcase</p>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
