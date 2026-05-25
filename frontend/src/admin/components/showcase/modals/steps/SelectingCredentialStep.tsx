import type { Credential } from '../../../../types'

import { publicBaseUrl } from '../../../../api/adminApi'

interface SelectingCredentialStepProps {
  credentials: Credential[]
  loading: boolean
  error: string | null
  onSelectCredential: (credential: Credential) => void
  onCreateNew: () => void
}

export function SelectingCredentialStep({
  credentials,
  loading,
  error,
  onSelectCredential,
  onCreateNew,
}: SelectingCredentialStepProps) {
  return (
    <>
      <p className="text-gray-600 mb-6">First select an existing credential or create a new credential.</p>

      {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading credentials...</div>
      ) : credentials.length > 0 ? (
        <div className="space-y-3">
          <div className="space-y-2 max-h-96 min-h-64 overflow-y-auto">
            {credentials.map((credential) => (
              <button
                key={credential.id}
                onClick={() => onSelectCredential(credential)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-bcgov-blue transition-colors flex items-center gap-3"
              >
                {credential.icon && (
                  <img
                    src={`${publicBaseUrl}${credential.icon}`}
                    alt={credential.name}
                    className="w-8 h-8 flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm text-bcgov-black">{credential.name}</p>
                  <p className="text-xs text-gray-500">v{credential.version}</p>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={onCreateNew}
            className="w-full px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
          >
            + Add New Credential
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-500 text-sm">No credentials available. Create one to get started.</p>
          <button
            onClick={onCreateNew}
            className="w-full px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
          >
            + Add New Credential
          </button>
        </div>
      )}
    </>
  )
}
