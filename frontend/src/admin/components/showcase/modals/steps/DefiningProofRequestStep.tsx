import type { Credential, CredentialRequest as PresentationRequest } from '../../../../types'

import { ArrowUpTrayIcon, PencilIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../../../../api/adminApi'

interface DefiningProofRequestStepProps {
  currentCredential: Credential | null
  currentRequest: PresentationRequest | null
  currentIndex: number
  totalCredentials: number
  onUpdateRequest: (updates: Partial<PresentationRequest>) => void
  onUploadIcon: () => void
  onPrevious: () => void
  onNext: () => void
  onFinish: () => void
}

export function DefiningProofRequestStep({
  currentCredential,
  currentRequest,
  currentIndex,
  totalCredentials,
  onUpdateRequest,
  onUploadIcon,
  onPrevious,
  onNext,
  onFinish,
}: DefiningProofRequestStepProps) {
  if (!currentCredential || !currentRequest) return null

  const isIconSelected = !!currentRequest.icon

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          {currentCredential.icon && (
            <img
              src={`${publicBaseUrl}${currentCredential.icon}`}
              alt={currentCredential.name}
              className="w-10 h-10 object-contain"
            />
          )}
          <div>
            <h3 className="text-lg font-semibold text-bcgov-black">{currentCredential.name}</h3>
            <p className="text-xs text-gray-500">v{currentCredential.version}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600">Configure the presentation request details for this credential</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-bcgov-black mb-2">Icon</label>
          <div className="relative group w-fit">
            {currentRequest.icon ? (
              <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={`${publicBaseUrl}${currentRequest.icon}`}
                  alt="Selected icon"
                  className="w-full h-full object-contain"
                />
                <PencilIcon
                  onClick={onUploadIcon}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                />
              </div>
            ) : (
              <button
                onClick={onUploadIcon}
                className="px-3 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Add Icon
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bcgov-black mb-2">Schema ID</label>
          <p className="text-xs text-gray-500 mb-1">
            Optional - Restrict the presentation request to a specific schema
          </p>
          <input
            type="text"
            value={currentRequest.schema_id || ''}
            onChange={(e) => onUpdateRequest({ schema_id: e.target.value || undefined })}
            placeholder="e.g., QEquAHkM35w4XVT3Ku5yat:2:student_card:1.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-bcgov-black mb-2">Requested Attributes</label>
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            {/* Properties Section */}
            {currentRequest.properties && currentRequest.properties.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-bcgov-black mb-2">📋 Properties (Reveal)</p>
                <div className="space-y-1 ml-3">
                  {currentRequest.properties.map((prop) => (
                    <div key={prop} className="text-sm text-gray-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-bcgov-blue rounded-full"></span>
                      {prop}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Predicates Section */}
            {currentRequest.predicates && currentRequest.predicates.length > 0 && (
              <div className="pt-2 border-t border-gray-300">
                <p className="text-xs font-semibold text-bcgov-black mb-2">🔐 Predicates (Prove)</p>
                <div className="space-y-1 ml-3">
                  {currentRequest.predicates.map((pred) => {
                    const operatorSymbols: Record<string, string> = {
                      '>=': '≥',
                      '>': '>',
                      '<=': '≤',
                      '<': '<',
                    }
                    return (
                      <div key={pred.name} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                        <span className="font-medium">{pred.name}</span>
                        <span className="text-gray-500">
                          {operatorSymbols[pred.type as keyof typeof operatorSymbols] || pred.type}
                        </span>
                        <span className="font-mono text-gray-600">{pred.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Non-Revoked Section */}
            {currentRequest.nonRevoked && (
              <div className="pt-2 border-t border-gray-300">
                <p className="text-xs font-semibold text-bcgov-black mb-2">✓ Non-Revoked</p>
                <div className="text-sm text-gray-700 flex items-center gap-2 ml-3">
                  <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                  Credential must not be revoked
                </div>
              </div>
            )}

            {!currentRequest.properties?.length && !currentRequest.predicates?.length && !currentRequest.nonRevoked && (
              <p className="text-xs text-gray-500 italic">No attributes selected</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <div className="flex gap-3">
          {currentIndex > 0 && (
            <button
              onClick={onPrevious}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Previous
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {currentIndex < totalCredentials - 1 && (
            <button
              onClick={onNext}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Next
            </button>
          )}
          {currentIndex === totalCredentials - 1 && (
            <button
              onClick={onFinish}
              disabled={!isIconSelected}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isIconSelected
                  ? 'text-white bg-bcgov-blue hover:bg-bcgov-blue-dark cursor-pointer'
                  : 'text-white bg-gray-400 cursor-not-allowed'
              }`}
            >
              Finish
            </button>
          )}
        </div>
      </div>

      {!isIconSelected && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Please complete the following:</p>
          <ul className="text-sm text-red-700 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-700 rounded-full" />
              Presentation request icon is required
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}
