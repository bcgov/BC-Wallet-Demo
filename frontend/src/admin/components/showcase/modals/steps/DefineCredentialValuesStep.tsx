import type { Schema } from '../../../../types'

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { publicBaseUrl } from '../../../../api/adminApi'
import { ImageUploadModal } from '../ImageUploadModal'

interface DefineCredentialValuesStepProps {
  selectedSchema: Schema | null
  onBack: () => void
  onSelectCredential: (values: Record<string, string>, icon: string) => void
  error?: string | null
}

export function DefineCredentialValuesStep({
  selectedSchema,
  onBack,
  onSelectCredential,
  error,
}: DefineCredentialValuesStepProps) {
  const [values, setValues] = useState<Record<string, string>>(
    selectedSchema
      ? selectedSchema.attrNames.reduce(
          (acc, attr) => {
            acc[attr] = ''
            return acc
          },
          {} as Record<string, string>,
        )
      : {},
  )
  const [icon, setIcon] = useState<string>('')
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)

  if (!selectedSchema) return null

  const handleInputChange = (attrName: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [attrName]: value,
    }))
  }

  const handleImageSelect = (imagePath: string) => {
    setIcon(imagePath)
  }

  const isFormValid = () => {
    // Check if icon is selected
    if (!icon) return false

    // Check if all attribute values are filled
    return selectedSchema.attrNames.every((attr) => values[attr] && values[attr].trim().length > 0)
  }

  const getValidationErrors = () => {
    const errors: string[] = []
    if (!icon) {
      errors.push('Credential icon is required')
    }
    selectedSchema.attrNames.forEach((attr) => {
      if (!values[attr] || values[attr].trim().length === 0) {
        errors.push(`${attr.replace(/_/g, ' ')} is required`)
      }
    })
    return errors
  }

  const handleSubmit = () => {
    if (isFormValid()) {
      onSelectCredential(values, icon)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-2xl font-semibold text-bcgov-black mb-1">{selectedSchema.name}</h3>
        <p className="text-gray-600">v{selectedSchema.version}</p>

        <div className="mt-6">
          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              {icon ? (
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
                  <img src={`${publicBaseUrl}${icon}`} alt="Credential icon" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                  <ArrowUpTrayIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <button
                onClick={() => setIsImageUploadModalOpen(true)}
                className="mt-3 px-3 py-1.5 text-sm font-medium text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg transition-colors flex items-center gap-1"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
                Upload Icon
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Credential Icon</p>
              <p className="text-xs text-gray-500">Upload an SVG or image file to display as the credential icon</p>
            </div>
          </div>
        </div>
      </div>

      {selectedSchema.attrNames && selectedSchema.attrNames.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-bcgov-black mb-4 uppercase tracking-wide">
            Enter Attribute Values
          </h4>
          <div className="space-y-4">
            {selectedSchema.attrNames.map((attrName: string) => (
              <div key={attrName} className="flex flex-col">
                <label className="text-sm font-semibold text-bcgov-black mb-2 capitalize">
                  {attrName.replace(/_/g, ' ')}
                </label>
                <input
                  type="text"
                  value={values[attrName]}
                  onChange={(e) => handleInputChange(attrName, e.target.value)}
                  placeholder={`Enter ${attrName.replace(/_/g, ' ')}`}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-bcgov-black placeholder-gray-400 transition-all focus:outline-none focus:border-bcgov-blue focus:ring-1 focus:ring-bcgov-blue hover:border-gray-300"
                />
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
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
            isFormValid() ? 'bg-bcgov-blue hover:bg-bcgov-blue-dark cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          Create Credential
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800">{error}</p>
        </div>
      )}

      {!error && !isFormValid() && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-800 mb-2">Please complete the following:</p>
          <ul className="text-sm text-red-700 space-y-1">
            {getValidationErrors().map((validationError, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1 h-1 bg-red-700 rounded-full" />
                {validationError}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSelectImage={handleImageSelect}
        type="icon"
      />
    </div>
  )
}
