import type { Schema } from '../../types'

import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createSchema, getAvailableSchemas } from '../../api/adminApi'
import log from '../../utils/logger'

interface Attribute {
  name: string
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
  const [attrNames, setAttrNames] = useState<Attribute[]>([])
  const [attributeKey, setAttributeKey] = useState('')
  const [revocable, setRevocable] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [availableSchemas, setAvailableSchemas] = useState<Schema[]>([])
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [progress, setProgress] = useState(0)

  // Fetch available schemas when modal opens
  useEffect(() => {
    if (!isOpen || !auth.user?.access_token) return

    const fetchSchemas = async () => {
      try {
        const schemas = await getAvailableSchemas(auth)
        setAvailableSchemas(schemas)
      } catch (err) {
        // Don't show error to user, just log it
        log.error('Failed to fetch schemas:', err)
      }
    }

    fetchSchemas()
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
      setAttrNames([...attrNames, { name: attributeKey }])
      setAttributeKey('')
    }
  }

  const handleRemoveAttribute = (index: number) => {
    setAttrNames(attrNames.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setVersion('')
    setAttrNames([])
    setAttributeKey('')
    setRevocable(true)
    setError('')
    onClose()
  }

  const handleCreate = () => {
    if (!name.trim() || !version.trim()) {
      setError('Name and version are required')
      return
    }

    const versionPattern = /^\d+\.\d+(\.\d+)?$/
    if (!versionPattern.test(version.trim())) {
      setError('Version must be in format 1.0 or 1.0.0')
      return
    }

    if (attrNames.length === 0) {
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
        attrNames: attrNames.map((attr) => attr.name),
        revocable,
      })
      // Reset form and notify parent to refresh
      setName('')
      setVersion('')
      setAttrNames([])
      setAttributeKey('')
      setRevocable(true)
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
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-bcgov-black">Confirm Schema Creation</h2>
            <button onClick={handleCancelConfirmation} className="text-gray-400 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This will create a new schema on the data registry. Please review the information before proceeding.
            </p>

            {/* Schema Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-600">Schema Name</p>
                <p className="text-base font-semibold text-bcgov-black">{name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Version</p>
                <p className="text-base font-semibold text-bcgov-black">{version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Attributes ({attrNames.length})</p>
                {attrNames.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {attrNames.map((attr, index) => (
                      <p key={index} className="text-sm text-gray-700">
                        • {attr.name}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No attributes</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Revocable</p>
                <p className="text-base font-semibold text-bcgov-black">{revocable ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isLoading && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-bcgov-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">Creating schema...</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={handleCancelConfirmation}
              disabled={isLoading}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmCreate}
              disabled={isLoading}
              className="px-4 py-2 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
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
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-bcgov-black">Create Schema</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form Content */}
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-bcgov-black mb-2">
              Schema Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Digital Business Card"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20"
            />
          </div>

          {/* Version Input */}
          <div>
            <label htmlFor="version" className="block text-sm font-medium text-bcgov-black mb-2">
              Version
            </label>
            <input
              id="version"
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g., 1.0.0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20"
            />
          </div>
          {/* Attributes Input */}
          <div>
            <label className="block text-sm font-medium text-bcgov-black mb-2">Attributes</label>
            <div className="space-y-3">
              {/* Add Attribute Inputs */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={attributeKey}
                  onChange={(e) => setAttributeKey(e.target.value)}
                  placeholder="Key (e.g., business_name)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 text-sm"
                />
                <button
                  onClick={handleAddAttribute}
                  disabled={!attributeKey.trim()}
                  className="px-4 py-2 bg-bcgov-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                >
                  Add
                </button>
              </div>

              {/* Attributes List */}
              {attrNames.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                  {attrNames.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded border border-gray-300"
                    >
                      <span className="font-semibold text-bcgov-black">{attr.name}</span>
                      <button
                        onClick={() => handleRemoveAttribute(index)}
                        className="ml-3 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Revocable Toggle */}
          <div>
            <label className="block text-sm font-medium text-bcgov-black mb-3">Revocation Settings</label>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="revocable"
                checked={revocable}
                onChange={(e) => setRevocable(e.target.checked)}
                className="w-4 h-4 text-bcgov-blue bg-white border border-gray-300 rounded focus:ring-2 focus:ring-bcgov-blue cursor-pointer"
              />
              <label htmlFor="revocable" className="text-sm text-gray-700 cursor-pointer">
                Allow credentials issued with this schema to be revoked
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-4">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading || !name.trim() || !version.trim() || attrNames.length === 0}
            className="px-4 py-2 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
