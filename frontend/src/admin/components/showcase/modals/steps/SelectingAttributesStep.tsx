import type { Credential, AttributeRequest, Schema } from '../../../../types'

import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { getSchemaById, publicBaseUrl } from '../../../../api/adminApi'
import { truncateLongString } from '../../../../utils/formatters'
import logger from '../../../../utils/logger'

interface SelectingAttributesStepProps {
  currentCredential: Credential | null
  selectedAttributes: Map<string, AttributeRequest>
  currentIndex: number
  totalCredentials: number
  initialRequest?: any
  onUpdateAttribute: (attributeName: string, request: AttributeRequest) => void
  onRemoveAttribute: (attributeName: string) => void
  onPrevious: () => void
  onNext: () => void
  onContinue: () => void
  onClose: () => void
}

export function SelectingAttributesStep({
  currentCredential,
  selectedAttributes,
  currentIndex,
  totalCredentials,
  initialRequest,
  onUpdateAttribute,
  onRemoveAttribute,
  onPrevious,
  onNext,
  onContinue,
  onClose,
}: SelectingAttributesStepProps) {
  const auth = useAuth()
  const [schema, setSchema] = useState<Schema | null>(null)
  const [predicateDateOptions, setPredicateDateOptions] = useState<Record<string, 'custom' | 'relative'>>({})
  const [predicateYearOffsets, setPredicateYearOffsets] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchSchema = async () => {
      if (currentCredential?.schema_id && auth.isAuthenticated) {
        try {
          const schemaData = await getSchemaById(auth, currentCredential.schema_id)
          setSchema(schemaData)

          // Initialize predicate date options from selectedAttributes
          const newDateOptions: Record<string, 'custom' | 'relative'> = {}
          const newYearOffsets: Record<string, number> = {}

          schemaData.attributes.forEach((attr: { name: string; type: string }) => {
            if (attr.type === 'date') {
              // Check all selected attributes for this credential
              selectedAttributes.forEach((request, attrName) => {
                if (attrName === attr.name && request.predicate) {
                  const value = request.predicateValue
                  if (value && value.startsWith('$dateint:')) {
                    const yearOffset = parseInt(value.replace('$dateint:', ''), 10)
                    newDateOptions[attrName] = 'relative'
                    newYearOffsets[attrName] = yearOffset
                  } else if (value) {
                    newDateOptions[attrName] = 'custom'
                  }
                }
              })
            }
          })

          setPredicateDateOptions(newDateOptions)
          setPredicateYearOffsets(newYearOffsets)
        } catch (error) {
          logger.error('Error fetching schema:', error)
          setSchema(null)
        }
      }
    }
    fetchSchema()
  }, [currentCredential, selectedAttributes, auth.isAuthenticated])

  if (!currentCredential) return null
  const isAttributeSelected = (attrName: string) => {
    const request = selectedAttributes.get(attrName)
    return request && (request.property || request.predicate || request.nonRevoked)
  }

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
        <p className="text-sm text-gray-600">Configure how each attribute should be requested</p>
      </div>

      {currentCredential.attributes && currentCredential.attributes.length > 0 ? (
        <div className="space-y-4">
          {currentCredential.attributes.map((attr: { name: string; value: any }) => {
            const request = selectedAttributes.get(attr.name) || {}
            const selected = isAttributeSelected(attr.name)

            return (
              <div key={attr.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-bcgov-black">{attr.name}</p>
                    <p className="text-xs text-gray-500">{truncateLongString(attr.value)}</p>
                  </div>
                  {selected && (
                    <button
                      onClick={() => onRemoveAttribute(attr.name)}
                      className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={request.property || false}
                      onChange={(e) => {
                        const updated = { ...request, property: e.target.checked }
                        if (e.target.checked || request.predicate || request.nonRevoked) {
                          onUpdateAttribute(attr.name, updated)
                        } else {
                          onRemoveAttribute(attr.name)
                        }
                      }}
                      className="w-4 h-4 text-bcgov-blue border-gray-300 rounded focus:ring-2 focus:ring-bcgov-blue"
                    />
                    <div>
                      <p className="text-sm font-medium text-bcgov-black">Property (Reveal)</p>
                      <p className="text-xs text-gray-500">Show this attribute to the verifier</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={request.predicate || false}
                      onChange={(e) => {
                        const updated = { ...request, predicate: e.target.checked }
                        if (!e.target.checked) {
                          delete updated.predicateType
                          delete updated.predicateValue
                        } else {
                          // When checking the predicate box, set defaults
                          if (!updated.predicateType) {
                            updated.predicateType = '>='
                          }
                        }
                        if (e.target.checked || request.property || request.nonRevoked) {
                          onUpdateAttribute(attr.name, updated)
                        } else {
                          onRemoveAttribute(attr.name)
                        }
                      }}
                      className="w-4 h-4 text-bcgov-blue border-gray-300 rounded focus:ring-2 focus:ring-bcgov-blue"
                    />
                    <div>
                      <p className="text-sm font-medium text-bcgov-black">Predicate (Prove)</p>
                      <p className="text-xs text-gray-500">Prove attribute value without revealing it</p>
                    </div>
                  </label>

                  {request.predicate && (
                    <div className="ml-7 space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Operator</label>
                        <select
                          value={request.predicateType || ''}
                          onChange={(e) => {
                            const updated = { ...request, predicateType: e.target.value as any }
                            onUpdateAttribute(attr.name, updated)
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bcgov-blue focus:border-transparent"
                        >
                          <option value=">=">Greater Than or Equal (≥)</option>
                          <option value=">">Greater Than (&gt;)</option>
                          <option value="<=">Less Than or Equal (≤)</option>
                          <option value="<">Less Than (&lt;)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Value</label>
                        {schema && schema.attributes.find((a: any) => a.name === attr.name)?.type === 'date' ? (
                          <div className="space-y-3">
                            <p
                              className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                              hidden={predicateDateOptions[attr.name] === 'relative'}
                            >
                              Select an explicit date
                            </p>
                            <p
                              className="text-xs font-semibold text-gray-700 uppercase tracking-wide"
                              hidden={
                                predicateDateOptions[attr.name] === 'custom' ||
                                predicateDateOptions[attr.name] === undefined
                              }
                            >
                              Years relative to presentation
                            </p>
                            <input
                              type="date"
                              value={request.predicateValue || ''}
                              onChange={(e) => {
                                const updated = { ...request, predicateValue: e.target.value }
                                onUpdateAttribute(attr.name, updated)
                              }}
                              placeholder="Enter the date to compare against"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bcgov-blue focus:border-transparent"
                              hidden={predicateDateOptions[attr.name] === 'relative'}
                            />
                            <input
                              type="number"
                              value={predicateYearOffsets[attr.name] ?? 0}
                              onChange={(e) => {
                                const parsed = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                                const numVal = Number.isNaN(parsed) ? 0 : parsed
                                setPredicateYearOffsets((prev) => ({ ...prev, [attr.name]: numVal }))
                                const updated = { ...request, predicateValue: `$dateint:${numVal}` }
                                onUpdateAttribute(attr.name, updated)
                              }}
                              placeholder="Years offset (positive or negative)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bcgov-blue focus:border-transparent"
                              hidden={
                                predicateDateOptions[attr.name] === 'custom' ||
                                predicateDateOptions[attr.name] === undefined
                              }
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setPredicateDateOptions((prev) => ({ ...prev, [attr.name]: 'custom' }))
                                  setPredicateYearOffsets((prev) => ({ ...prev, [attr.name]: 0 }))
                                  const updated = { ...request, predicateValue: '' }
                                  onUpdateAttribute(attr.name, updated)
                                }}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  predicateDateOptions[attr.name] !== 'relative'
                                    ? 'bg-bcgov-blue text-white border border-bcgov-blue'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-bcgov-blue'
                                }`}
                              >
                                Custom Date
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentOffset = predicateYearOffsets[attr.name] ?? 0
                                  setPredicateDateOptions((prev) => ({ ...prev, [attr.name]: 'relative' }))
                                  setPredicateYearOffsets((prev) => ({ ...prev, [attr.name]: currentOffset }))
                                  const updated = { ...request, predicateValue: `$dateint:${currentOffset}` }
                                  onUpdateAttribute(attr.name, updated)
                                }}
                                className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                                  predicateDateOptions[attr.name] === 'relative'
                                    ? 'bg-bcgov-blue text-white border border-bcgov-blue'
                                    : 'bg-white text-gray-700 border border-gray-300 hover:border-bcgov-blue'
                                }`}
                              >
                                Time of Presentation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={request.predicateValue || ''}
                            onChange={(e) => {
                              const updated = { ...request, predicateValue: e.target.value }
                              onUpdateAttribute(attr.name, updated)
                            }}
                            placeholder="Enter the value to compare against"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-bcgov-blue focus:border-transparent"
                          />
                        )}
                      </div>
                    </div>
                  )}

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={request.nonRevoked || false}
                      onChange={(e) => {
                        const updated = { ...request, nonRevoked: e.target.checked }
                        if (e.target.checked || request.property || request.predicate) {
                          onUpdateAttribute(attr.name, updated)
                        } else {
                          onRemoveAttribute(attr.name)
                        }
                      }}
                      className="w-4 h-4 text-bcgov-blue border-gray-300 rounded focus:ring-2 focus:ring-bcgov-blue"
                    />
                    <div>
                      <p className="text-sm font-medium text-bcgov-black">Non-Revoked</p>
                      <p className="text-xs text-gray-500">Verify this credential has not been revoked</p>
                    </div>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic">No attributes available for this credential</p>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <div className="flex gap-3">
          {initialRequest && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
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
              onClick={onContinue}
              className="px-4 py-2 text-white bg-bcgov-blue hover:bg-bcgov-blue-dark rounded-lg font-medium transition-colors"
            >
              {initialRequest ? 'Update' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
