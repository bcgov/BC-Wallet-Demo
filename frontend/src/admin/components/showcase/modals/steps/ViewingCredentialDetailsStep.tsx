import type { Credential } from '../../../../types'

import { publicBaseUrl } from '../../../../api/adminApi'

interface ViewingCredentialDetailsStepProps {
  selectedCredential: Credential | null
  onBack: () => void
  onSelectCredential: () => void
}

export function ViewingCredentialDetailsStep({
  selectedCredential,
  onBack,
  onSelectCredential,
}: ViewingCredentialDetailsStepProps) {
  if (!selectedCredential) return null

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        {selectedCredential.icon && (
          <div className="mb-4">
            <img
              src={`${publicBaseUrl}${selectedCredential.icon}`}
              alt={selectedCredential.name}
              className="w-16 h-16"
            />
          </div>
        )}
        <h3 className="text-2xl font-semibold text-bcgov-black mb-1">{selectedCredential.name}</h3>
        <p className="text-gray-600">v{selectedCredential.version}</p>
      </div>

      {selectedCredential.attributes && selectedCredential.attributes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-bcgov-black mb-3">Attributes</h4>
          <div className="space-y-2">
            {selectedCredential.attributes.map((attr: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-3 rounded border border-gray-200"
              >
                <span className="font-medium text-bcgov-black">{attr.name}:</span>
                <span className="text-gray-600 text-sm">{attr.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
        >
          Back
        </button>
        <button
          onClick={onSelectCredential}
          className="px-4 py-2 text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg font-medium transition-colors"
        >
          Select Credential
        </button>
      </div>
    </div>
  )
}
