import { ArrowUpTrayIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { publicBaseUrl } from '../../api/adminApi'
import { ImageUploadModal } from '../ImageUploadModal'

interface Attribute {
  name: string
  value: string
}

interface CreateCredentialModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCredentialModal({ isOpen, onClose }: CreateCredentialModalProps) {
  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [image, setImage] = useState('')
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [attributeKey, setAttributeKey] = useState('')
  const [attributeValue, setAttributeValue] = useState('')

  const handleAddAttribute = () => {
    if (attributeKey.trim() && attributeValue.trim()) {
      setAttributes([...attributes, { name: attributeKey, value: attributeValue }])
      setAttributeKey('')
      setAttributeValue('')
    }
  }

  const handleRemoveAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index))
  }

  const handleCreate = () => {
    // Create functionality will be implemented later
  }

  const handleClose = () => {
    // Reset form
    setName('')
    setVersion('')
    setImage('')
    setAttributes([])
    setAttributeKey('')
    setAttributeValue('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-bcgov-black">Create New Credential</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-bcgov-black mb-2">
              Credential Name
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

          {/* Image Input */}
          <div>
            <label className="block text-sm font-medium text-bcgov-black mb-2">Image</label>
            <div className="relative group w-fit">
              {image ? (
                <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={`${publicBaseUrl}${image}`}
                    alt="Credential icon preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => setIsImageUploadModalOpen(true)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                  >
                    <ArrowUpTrayIcon className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsImageUploadModalOpen(true)}
                  className="px-3 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
                >
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  Add Image
                </button>
              )}
            </div>
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
                <input
                  type="text"
                  value={attributeValue}
                  onChange={(e) => setAttributeValue(e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-bcgov-blue focus:ring-2 focus:ring-bcgov-blue focus:ring-opacity-20 text-sm"
                />
                <button
                  onClick={handleAddAttribute}
                  disabled={!attributeKey.trim() || !attributeValue.trim()}
                  className="px-4 py-2 bg-bcgov-blue text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors text-sm"
                >
                  Add
                </button>
              </div>

              {/* Attributes List */}
              {attributes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-200">
                  {attributes.map((attr, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded border border-gray-300"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-bcgov-black">{attr.name}:</span>{' '}
                        <span className="text-gray-600">
                          {attr.value.length > 50 ? `${attr.value.substring(0, 50)}...` : attr.value}
                        </span>
                      </div>
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
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 text-white bg-bcgov-blue hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        onSelectImage={(imagePath) => {
          setImage(imagePath)
          setIsImageUploadModalOpen(false)
        }}
      />
    </div>
  )
}
