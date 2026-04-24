import type { CustomCharacter } from '../types'

import { baseUrl } from '../../client/api/BaseUrl'

interface CredentialsTabProps {
  character: CustomCharacter | null
}

export function CredentialsTab({ character }: CredentialsTabProps) {
  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Credentials Tab */}
      <div className="w-full max-w-6xl mb-8 px-6">
        <h2 className="text-2xl font-semibold text-bcgov-black">Credentials</h2>
        <h5 className="text-gray-500 mt-2">
          Manage credential configurations. These will be displayed in the accept credential screen.
        </h5>
      </div>
      <div className="w-full max-w-6xl px-6 space-y-6">
        {character?.onboarding?.flatMap(
          (screen, idx) =>
            screen.credentials?.map((credential, credIdx) => (
              <div key={`${idx}-${credIdx}`} className="border border-gray-300 rounded-lg bg-white p-8">
                <div className="text-xs text-gray-500 mb-3">
                  From:{' '}
                  {screen.screenId
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ')}
                </div>
                <div className="flex items-center gap-4 mb-6">
                  {credential.icon && (
                    <img
                      src={`${baseUrl}${credential.icon}`}
                      alt={credential.name}
                      className="w-12 h-12 rounded-lg object-contain bg-gray-100"
                    />
                  )}
                  <div>
                    <p className="text-sm font-bold text-bcgov-black">{credential.name}</p>
                    <p className="text-xs text-gray-600">v{credential.version}</p>
                  </div>
                </div>
                {credential.attributes && credential.attributes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-bcgov-black mb-2">Attributes</p>
                    <div className="space-y-2">
                      {credential.attributes.map((attr, attrIdx) => {
                        const displayValue = attr.value.length > 100 ? `${attr.value.substring(0, 100)}...` : attr.value
                        return (
                          <div key={attrIdx} className="text-xs bg-gray-50 p-2 rounded">
                            <span className="font-semibold text-bcgov-black">{attr.name}:</span>{' '}
                            <span className="text-gray-600">{displayValue}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )) || [],
        )}
      </div>
    </div>
  )
}
