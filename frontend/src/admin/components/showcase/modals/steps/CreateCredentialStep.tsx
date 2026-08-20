import type { Credential, CredentialRequest, Showcase } from '../../../../types'

import { publicBaseUrl } from '../../../../api/adminApi'

const hasIdentifier = (value?: string | string[]): boolean => {
  if (Array.isArray(value)) return value.some((entry) => entry.trim().length > 0)
  return typeof value === 'string' && value.trim().length > 0
}

const isMinimallyValidExternalCredential = (credential: CredentialRequest): boolean =>
  credential.name.trim().length > 0 &&
  (hasIdentifier(credential.schema_id) || hasIdentifier(credential.cred_def_id)) &&
  Boolean(credential.properties?.length || credential.predicates?.length)

interface CreateCredentialStepProps {
  showcase: Showcase | null | undefined
  selectedCredentials: Set<string>
  onSelectCredential: (credentialId: string, checked: boolean) => void
  onBack: () => void
  onContinue: () => void
  externalCredentials: Map<string, CredentialRequest>
  onAddExternal: () => void
  onEditExternal: (key: string) => void
  onRemoveExternal: (key: string) => void
}

export function CreateCredentialStep({
  showcase,
  selectedCredentials,
  onSelectCredential,
  onBack,
  onContinue,
  externalCredentials,
  onAddExternal,
  onEditExternal,
  onRemoveExternal,
}: CreateCredentialStepProps) {
  const hasValidExternalCredentials = Array.from(externalCredentials.values()).every(isMinimallyValidExternalCredential)
  const hasCredentials = selectedCredentials.size > 0 || externalCredentials.size > 0

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

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-bcgov-black">External credentials (advanced)</h3>
          <p className="text-xs text-gray-500">
            Request a credential issued outside this showcase using its ledger identifiers.
          </p>
        </div>
        {Array.from(externalCredentials.entries()).map(([key, credential]) => (
          <div
            key={key}
            className="border border-amber-200 bg-amber-50 rounded-lg p-3 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-bcgov-black">{credential.name}</p>
              <p className="text-xs font-mono text-gray-600 break-all">
                {credential.cred_def_id || credential.schema_id}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => onEditExternal(key)} className="text-xs text-bcgov-blue">
                Edit
              </button>
              <button onClick={() => onRemoveExternal(key)} className="text-xs text-red-700">
                Remove
              </button>
            </div>
          </div>
        ))}
        <button
          onClick={onAddExternal}
          className="w-full px-4 py-2 text-sm text-bcgov-blue border border-bcgov-blue rounded-lg hover:bg-blue-50"
        >
          Add external credential (advanced)
        </button>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={!hasCredentials || !hasValidExternalCredentials}
          className="px-4 py-2 text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg font-medium transition-colors disabled:bg-gray-300"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
