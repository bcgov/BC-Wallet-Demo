import type { Did, Schema } from '../../types'

import { XMarkIcon, TrashIcon, CircleStackIcon, GlobeAltIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createSchema, getAvailableSchemas, getAvailableDids } from '../../api/adminApi'
import log from '../../utils/logger'

interface Attribute {
  name: string
  type: 'string' | 'date' | 'number' | 'image'
}

interface CreateSchemaModalProps {
  isOpen: boolean
  onClose: () => void
  onSchemaCreated?: (schema: Schema) => void
}

export function CreateSchemaModal({ isOpen, onClose, onSchemaCreated }: CreateSchemaModalProps) {
  const auth = useAuth()
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [selectedDid, setSelectedDid] = useState<Did | null>(null)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeKey, setAttributeKey] = useState('')
  const [attributeType, setAttributeType] = useState<'string' | 'date' | 'number'>('string')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [availableDids, setAvailableDids] = useState<Did[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [progress, setProgress] = useState(0)

  // Fetch available schemas and DIDs when modal opens
  useEffect(() => {
    if (!isOpen || !auth.user?.access_token) return

    const fetchData = async () => {
      try {
        const [schemas, dids] = await Promise.all([getAvailableSchemas(auth), getAvailableDids(auth)])
        setAvailableSchemas(schemas)
        setAvailableDids(dids)
      } catch (err) {
        // Don't show error to user, just log it
        log.error('Failed to fetch schemas or DIDs:', err)
      }
    }

    fetchData()
  }, [isOpen, auth])

  // Progress bar effect during schema creation
  useEffect(() => {
    if (!isLoading) {
      setProgress(0)
      return
    }

    const startTime = Date.now()
    const duration = 5000 // 5 seconds

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min((elapsed / duration) * 100, 95) // Cap at 95% until request completes
      setProgress(newProgress)
    }, 50)

    return () => clearInterval(progressInterval)
  }, [isLoading])

  const handleAddAttribute = () => {
    if (attributeKey.trim()) {
      setAttributes([...attributes, { name: attributeKey, type: attributeType }])
      setAttributeKey('')
      setAttributeType('string')
    }
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setVersion('')
    setSelectedDid(null)
    setAttributes([])
    setAttributeKey('')
    setAttributeType('string')
    setError('')
    onClose()
  }

  const handleCreate = () => {
    if (!name.trim() || !version.trim() || !selectedDid) {
      setError('Name, version, and DID method are required')
      return
    }

    const versionPattern = /^\d+\.\d+(\.\d+)?$/
    if (!versionPattern.test(version.trim())) {
      setError('Version must be in format 1.0 or 1.0.0')
      return
    }

    if (attributes.length === 0) {
      setError('At least one attribute is required')
      return
    }

    if (!auth.user?.access_token) {
      setError('Not authenticated')
      return
    }

    // Validate that schema name + version combination doesn't already exist
    const schemaExists = availableSchemas.some(
      (schema) => schema.name === name.trim() && schema.version === version.trim(),
    )
    if (schemaExists) {
      setError(`A schema with name "${name}" and version "${version}" already exists. Please bump the version.`)
      return
    }

    // Show confirmation dialog
    setError('')
    setShowConfirmation(true)
  }

  const handleConfirmCreate = async () => {
    setIsLoading(true)
    setError('')

    try {
      const newSchema = await createSchema(auth, {
        name,
        version,
        attributes: attributes.map((attr) => ({ name: attr.name, type: attr.type })),
        did: selectedDid?.did || '',
      })
      // Reset form and notify parent to refresh
      setName('')
      setVersion('')
      setSelectedDid(null)
      setAttributes([])
      setAttributeKey('')
      setAttributeType('string')
      setError('')
      setShowConfirmation(false)
      setProgress(100) // Complete the progress bar
      onClose()
      onSchemaCreated?.(newSchema)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schema')
      setShowConfirmation(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelConfirmation = () => {
    setShowConfirmation(false)
  }

  if (!isOpen) return null

  // Show confirmation modal if needed
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-bcgov-black">Confirm Schema Creation</h2>
              <p className="text-sm text-gray-500 mt-1">Please review the information before proceeding</p>
            </div>
            <button onClick={handleCancelConfirmation} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-8">
            <p className="text-gray-700 mb-6">
              This will create a new schema on the data registry. Please review the information before proceeding.
            </p>

            {/* Schema Details */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-25 rounded-lg p-6 space-y-4 border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Schema Name</p>
                  <p className="text-lg font-bold text-bcgov-black">{name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Version</p>
                  <p className="text-lg font-bold text-bcgov-black">{version}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">DID Method</p>
                <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-3 py-1">
                  {selectedDid?.method === 'indy' && <CircleStackIcon className="h-4 w-4 text-bcgov-blue" />}
                  {selectedDid?.method === 'webvh' && <GlobeAltIcon className="h-4 w-4 text-bcgov-blue" />}
                  <span className="font-medium text-bcgov-blue text-sm">{selectedDid?.method}</span>
                </div>
              </div>
              {attributes.length > 0 && (
                <div className="pt-6 border-t border-blue-200">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-4">
                    Attributes ({attributes.length})
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {attributes.map((attr, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 bg-white border border-blue-200 px-4 py-2 rounded-full text-xs font-medium text-gray-700"
                      >
                        {attr.name}
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                          {attr.type}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-bcgov-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-3 text-center font-medium">Creating schema...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelConfirmation}
              disabled={isLoading}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCreate}
              disabled={isLoading}
              className="px-6 py-3 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Confirm & Create'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-bcgov-black">Create Schema</h2>
            <p className="text-sm text-gray-500 mt-1">Define a new schema for your credentials</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-bcgov-black mb-2">
              Schema Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Digital Business Card"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 transition-colors"
            />
          </div>

          {/* Version Input */}
          <div>
            <label htmlFor="version" className="block text-sm font-semibold text-bcgov-black mb-2">
              Version
            </label>
            <input
              id="version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 transition-colors"
            />
          </div>

          {/* DID Method Selector */}
          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-3">DID Method</label>
            <div className="flex gap-2">
              {availableDids.map((did) => {
                const isSelected = selectedDid?.did === did.did
                const Icon = did.method === 'indy' ? CircleStackIcon : did.method === 'webvh' ? GlobeAltIcon : null
                return (
                  <button
                    key={did.did}
                    onClick={() => setSelectedDid(did)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      isSelected
                        ? 'bg-bcgov-blue text-white border border-bcgov-blue shadow-md'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:border-bcgov-blue hover:bg-gray-50'
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="text-sm">{did.method}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Attributes Input */}
          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-3">Attributes</label>
            <div className="space-y-3">
              {/* Add Attribute Inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={attributeKey}
                  onChange={(e) => setAttributeKey(e.target.value)}
                  placeholder="Key (e.g., business_name)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 transition-colors text-sm"
                />
                <select
                  value={attributeType}
                  onChange={(e) => setAttributeType(e.target.value as 'string' | 'date' | 'number')}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 transition-colors text-sm bg-white"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                </select>
                <button
                  onClick={handleAddAttribute}
                  disabled={!attributeKey.trim()}
                  className="px-4 py-3 bg-bcgov-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                >
                  Add
                </button>
              </div>

              {/* Attributes List */}
              {attributes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
                  {attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 bg-white p-3 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <span className="font-medium text-bcgov-black text-sm">{attr.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                          {attr.type}
                        </span>
                        <button
                          onClick={() => handleRemoveAttribute(index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !name.trim() || !version.trim() || !selectedDid || attributes.length === 0}
            className="px-6 py-3 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
