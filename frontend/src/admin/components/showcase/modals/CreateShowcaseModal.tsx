import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createShowcase } from '../../../api/adminApi'

interface CreateShowcaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (showcaseName: string) => void
}

export function CreateShowcaseModal({ isOpen, onClose, onSuccess }: CreateShowcaseModalProps) {
  const auth = useAuth()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Please enter a showcase title')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const response = await createShowcase(auth, title, description)
      // Reset form and close modal
      setTitle('')
      setDescription('')
      onClose()
      // Navigate to the new showcase
      onSuccess?.(response.name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create showcase')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-l font-semibold text-bcgov-black">Create New Showcase</h2>
            <h5 className="text-gray-500 mt-2">
              Set up a new digital credential showcase with a title and description.
            </h5>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Showcase Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter showcase title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter showcase description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-lg text-bcgov-black font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="px-4 py-2 bg-bcgov-blue text-white font-semibold rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
