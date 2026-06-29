import type { Schema } from '../../../../types'

import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import { publicBaseUrl } from '../../../../api/adminApi'
import { CredentialImageUploadModal } from '../CredentialImageUploadModal'
import { ImageUploadModal } from '../ImageUploadModal'

interface DefineCredentialValuesStepProps {
  selectedSchema: Schema | null
  onBack: () => void
  onSelectCredential: (values: Record<string, string>, icon: string) => void
  error?: string | null
  initialValues?: Record<string, string>
  initialIcon?: string
}

export function DefineCredentialValuesStep({
  selectedSchema,
  onBack,
  onSelectCredential,
  error,
  initialValues,
  initialIcon,
}: DefineCredentialValuesStepProps) {
  const [values, setValues] = useState<Record<string, string>>(
    selectedSchema
      ? selectedSchema.attributes.reduce(
          (acc, attr) => {
            acc[attr.name] = initialValues?.[attr.name] ?? ''
            return acc
          },
          {} as Record<string, string>,
        )
      : {},
  )
  const [icon, setIcon] = useState<string>(initialIcon ?? '')
  const [dateOptions, setDateOptions] = useState<Record<string, 'custom' | 'issuance'>>({})
  const [yearOffsets, setYearOffsets] = useState<Record<string, number>>({})
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [credentialImageModalOpen, setCredentialImageModalOpen] = useState(false)
  const [currentImageAttribute, setCurrentImageAttribute] = useState<string | null>(null)

  // Initialize values when selectedSchema or initialValues change
  useEffect(() => {
    if (selectedSchema && initialValues) {
      const newValues = selectedSchema.attributes.reduce(
        (acc, attr) => {
          acc[attr.name] = initialValues[attr.name] ?? ''
          return acc
        },
        {} as Record<string, string>,
      )
      setValues(newValues)
    }
  }, [selectedSchema, initialValues])

  // Initialize date options based on initial values
  useEffect(() => {
    if (selectedSchema && initialValues) {
      const newDateOptions: Record<string, 'custom' | 'issuance'> = {}
      const newYearOffsets: Record<string, number> = {}

      selectedSchema.attributes.forEach((attr) => {
        if (attr.type === 'date') {
          const value = initialValues[attr.name]
          if (value) {
            if (value.startsWith('$dateint:')) {
              // Extract year offset from $dateint: format
              const yearOffset = parseInt(value.replace('$dateint:', ''), 10)
              newDateOptions[attr.name] = 'issuance'
              newYearOffsets[attr.name] = yearOffset
            } else if (!isNaN(Number(value))) {
              // It's a timestamp, convert to YYYY-MM-DD
              const date = new Date(Number(value) * 1000)
              const dateString = date.toISOString().split('T')[0]
              setValues((prev) => ({ ...prev, [attr.name]: dateString }))
              newDateOptions[attr.name] = 'custom'
            } else {
              // Assume it's already YYYY-MM-DD format
              newDateOptions[attr.name] = 'custom'
            }
          }
        }
      })

      setDateOptions(newDateOptions)
      setYearOffsets(newYearOffsets)
    }
  }, [selectedSchema, initialValues])

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

  const handleAttributeImageSelect = (imagePath: string) => {
    if (currentImageAttribute) {
      setValues((prev) => ({
        ...prev,
        [currentImageAttribute]: imagePath,
      }))
      setCurrentImageAttribute(null)
      setCredentialImageModalOpen(false)
    }
  }

  const openImageUploadModal = (attributeName: string) => {
    setCurrentImageAttribute(attributeName)
    setCredentialImageModalOpen(true)
  }

  const isFormValid = () => {
    // Check if icon is selected
    if (!icon) return false

    // Check if all attribute values are filled
    return selectedSchema.attributes.every((attr) => values[attr.name] && values[attr.name].trim().length > 0)
  }

  const getValidationErrors = () => {
    const errors: string[] = []
    if (!icon) {
      errors.push('Credential icon is required')
    }
    selectedSchema.attributes.forEach((attr) => {
      if (!values[attr.name] || values[attr.name].trim().length === 0) {
        errors.push(`${attr.name.replace(/_/g, ' ')} is required`)
      }
    })
    return errors
  }

  const handleSubmit = () => {
    if (isFormValid()) {
      // Construct final values with $dateint: prefix for issuance dates
      const finalValues = { ...values }
      selectedSchema.attributes.forEach((attr) => {
        if (attr.type === 'date') {
          if (dateOptions[attr.name] === 'custom' || dateOptions[attr.name] === undefined) {
            // Convert date to YYYYMMDD format
            const dateValue = values[attr.name]
            if (dateValue) {
              // Check if it's a Unix timestamp (number) or date string
              const timestampMs = !isNaN(Number(dateValue))
                ? Number(dateValue) * 1000 // Assume it's seconds, convert to milliseconds
                : new Date(dateValue).getTime() // Parse as date string

              if (!isNaN(timestampMs)) {
                const date = new Date(timestampMs)
                const year = date.getUTCFullYear()
                const month = String(date.getUTCMonth() + 1).padStart(2, '0')
                const day = String(date.getUTCDate()).padStart(2, '0')
                finalValues[attr.name] = `${year}${month}${day}`
              }
            }
          } else if (dateOptions[attr.name] === 'issuance') {
            const yearOffset = yearOffsets[attr.name] || 0
            finalValues[attr.name] = `$dateint:${yearOffset}`
          }
        }
      })
      onSelectCredential(finalValues, icon)
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

      {selectedSchema.attributes && selectedSchema.attributes.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-bcgov-black mb-4 uppercase tracking-wide">
            Enter Attribute Values
          </h4>
          <div className="space-y-4">
            {selectedSchema.attributes.map((attr) => (
              <div key={attr.name} className="flex flex-col">
                <label className="text-sm font-semibold text-bcgov-black mb-2 capitalize">
                  {attr.name.replace(/_/g, ' ')}
                  <span className="ml-2 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    {attr.type}
                  </span>
                </label>
                <input
                  type={attr.type === 'number' ? 'number' : 'text'}
                  value={values[attr.name]}
                  onChange={(e) => handleInputChange(attr.name, e.target.value)}
                  placeholder={`Enter ${attr.name.replace(/_/g, ' ')}`}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-bcgov-black placeholder-gray-400 transition-all focus:outline-none focus:border-bcgov-blue focus:ring-1 focus:ring-bcgov-blue hover:border-gray-300"
                  hidden={attr.type === 'date' || attr.type === 'image'}
                />
                {attr.type === 'image' && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                    {!values[attr.name] ? (
                      <button
                        type="button"
                        onClick={() => openImageUploadModal(attr.name)}
                        className="w-full px-4 py-3 text-sm font-medium text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg transition-colors"
                      >
                        Upload Image
                      </button>
                    ) : (
                      <img
                        onClick={() => openImageUploadModal(attr.name)}
                        src={values[attr.name]}
                        alt={attr.name}
                        className="w-24 h-24 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    )}
                  </div>
                )}
                {attr.type === 'date' && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                    <p className="text-s font-semibold text-gray-700 uppercase tracking-wide">Time Option</p>
                    <p
                      className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                      hidden={dateOptions[attr.name] === 'issuance'}
                    >
                      Select an explicit date
                    </p>
                    <p
                      className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                      hidden={dateOptions[attr.name] === 'custom' || dateOptions[attr.name] === undefined}
                    >
                      Years in the future or past of issuance
                    </p>
                    <input
                      type={'date'}
                      value={values[attr.name]}
                      onChange={(e) => handleInputChange(attr.name, e.target.value)}
                      placeholder={`Enter ${attr.name.replace(/_/g, ' ')}`}
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-bcgov-black placeholder-gray-400 transition-all focus:outline-none focus:border-bcgov-blue focus:ring-1 focus:ring-bcgov-blue hover:border-gray-300"
                      hidden={dateOptions[attr.name] === 'issuance'}
                    />
                    <input
                      type="number"
                      value={yearOffsets[attr.name] ?? 0}
                      onChange={(e) => {
                        const parsed = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                        const numVal = Number.isNaN(parsed) ? 0 : parsed
                        setYearOffsets((prev) => ({ ...prev, [attr.name]: numVal }))
                        setValues((prev) => ({ ...prev, [attr.name]: String(numVal) }))
                      }}
                      placeholder={`Enter ${attr.name.replace(/_/g, ' ')}`}
                      className="px-4 py-3 border-2 border-gray-200 rounded-lg bg-white text-bcgov-black placeholder-gray-400 transition-all focus:outline-none focus:border-bcgov-blue focus:ring-1 focus:ring-bcgov-blue hover:border-gray-300"
                      hidden={dateOptions[attr.name] === 'custom' || dateOptions[attr.name] === undefined}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDateOptions((prev) => ({ ...prev, [attr.name]: 'custom' }))
                          setYearOffsets((prev) => ({ ...prev, [attr.name]: 0 }))
                          setValues((prev) => ({ ...prev, [attr.name]: '' }))
                        }}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          dateOptions[attr.name] !== 'issuance'
                            ? 'bg-bcgov-blue text-white border border-bcgov-blue'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-bcgov-blue'
                        }`}
                      >
                        Custom Time
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentOffset = yearOffsets[attr.name] ?? 0
                          setDateOptions((prev) => ({ ...prev, [attr.name]: 'issuance' }))
                          setYearOffsets((prev) => ({ ...prev, [attr.name]: currentOffset }))
                          setValues((prev) => ({ ...prev, [attr.name]: String(currentOffset) }))
                        }}
                        className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                          dateOptions[attr.name] === 'issuance'
                            ? 'bg-bcgov-blue text-white border border-bcgov-blue'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-bcgov-blue'
                        }`}
                      >
                        Time of Issuance
                      </button>
                    </div>
                  </div>
                )}
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
          {initialValues ? 'Cancel' : 'Back'}
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={`px-4 py-2 text-white rounded-lg font-medium transition-colors ${
            isFormValid() ? 'bg-bcgov-blue hover:bg-bcgov-blue-dark cursor-pointer' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {initialValues ? 'Update Credential' : 'Create Credential'}
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

      <CredentialImageUploadModal
        isOpen={credentialImageModalOpen}
        onClose={() => {
          setCredentialImageModalOpen(false)
          setCurrentImageAttribute(null)
        }}
        onSelectImage={handleAttributeImageSelect}
      />
    </div>
  )
}
