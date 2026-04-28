import type { CustomCharacter, CustomUseCase } from '../../types'
import type { AuthContextProps } from 'react-oidc-context'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { updateCharacter } from '../../api/adminApi'

interface CreateScenarioModalProps {
  isOpen: boolean
  onClose: () => void
  character: CustomCharacter | null
  auth: AuthContextProps
  onRefresh?: () => void
  onScenarioCreated?: (scenarioId: string) => void
}

export function CreateScenarioModal({
  isOpen,
  onClose,
  character,
  auth,
  onRefresh,
  onScenarioCreated,
}: CreateScenarioModalProps) {
  const [scenarioName, setScenarioName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const generateGenericScenario = (name: string): CustomUseCase => {
    const id = name.toLowerCase().replace(/\s+/g, '_')
    return {
      id,
      name,
      screens: [
        {
          screenId: 'START',
          title: `Welcome to ${name}`,
          text: `In this scenario, you will use your digital credentials to complete a task with ${name}. This is a demonstration of how you can use your BC Wallet in real-world situations.`,
        },
        {
          screenId: 'CONNECTION',
          title: `Connect with ${name}`,
          text: `Imagine you're interacting with ${name}. They need to verify some information. Scan the QR code to continue.`,
          verifier: { name, icon: '/public/common/icon-wallet-light.svg' },
        },
        {
          screenId: 'PROOF',
          title: 'Confirm the information to send',
          text: `${name} is requesting some information from your credentials. Review what is being shared and confirm to proceed.`,
          requestOptions: {
            title: `${name} Request`,
            text: `${name} would like some of your personal information.`,
            requestedCredentials: [],
          },
        },
        {
          screenId: 'STEP_END',
          title: "You're done!",
          text: `You've successfully completed the interaction with ${name}. Your credentials were verified securely and privately.`,
        },
      ],
    }
  }

  const handleCreate = async () => {
    if (!scenarioName.trim() || !character) return

    try {
      setIsLoading(true)

      const newScenario = generateGenericScenario(scenarioName)
      const updatedScenario = [...(character.useCases || []), newScenario]

      await updateCharacter(auth, character.name, {
        useCases: updatedScenario,
      })

      onScenarioCreated?.(newScenario.id)
      onRefresh?.()
      setScenarioName('')
      onClose()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create scenario:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-bcgov-black">Create New Scenario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="scenarioName" className="block text-sm font-medium text-bcgov-black mb-2">
              Scenario Name
            </label>
            <input
              id="scenarioName"
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g., Student Discount, Room Booking"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium text-bcgov-blue">We'll auto-populate a basic use case</span> to get you
              started. You can edit the screens and customize them for your showcase.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!scenarioName.trim() || isLoading}
            className="px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
