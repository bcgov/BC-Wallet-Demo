import type { Schema } from '../../types'

import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createSchema } from '../../api/adminApi'

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

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
    setError('')
    onClose()
  }

  const handleCreate = async () => {
    if (!name.trim() || !version.trim()) {
      setError('Name and version are required')
      return
    }

    if (!auth.user?.access_token) {
      setError('Not authenticated')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const newSchema = await createSchema(auth, {
        name,
        version,
        attrNames: attrNames.map((attr) => attr.name),
      })
      // Reset form and notify parent to refresh
      setName('')
      setVersion('')
      setAttrNames([])
      setAttributeKey('')
      setError('')
      onClose()
      onSchemaCreated?.(newSchema)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schema')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

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
            disabled={isLoading || !name.trim() || !version.trim()}
            className="px-4 py-2 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
