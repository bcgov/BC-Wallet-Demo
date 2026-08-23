import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import { ErrorBanner } from '../../ErrorBanner'

interface RenameScenarioModalProps {
  isOpen: boolean
  currentName: string
  onClose: () => void
  onSave: (newName: string) => Promise<void>
}

export function RenameScenarioModal({ isOpen, currentName, onClose, onSave }: RenameScenarioModalProps) {
  const [scenarioName, setScenarioName] = useState(currentName)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset the input whenever a new scenario is opened for renaming
  useEffect(() => {
    if (isOpen) {
      setScenarioName(currentName)
      setError(null)
    }
  }, [isOpen, currentName])

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!scenarioName.trim()) return

    try {
      setIsLoading(true)
      setError(null)
      await onSave(scenarioName.trim())
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to rename scenario'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-bcgov-black">Rename Scenario</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        {/* Content */}
        <div className="p-6">
          <label htmlFor="renameScenarioName" className="block text-sm font-medium text-bcgov-black mb-2">
            Scenario Name
          </label>
          <input
            id="renameScenarioName"
            type="text"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            placeholder="e.g., Student Discount, Room Booking"
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue focus:border-transparent disabled:bg-gray-100"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!scenarioName.trim() || isLoading}
            className="px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
