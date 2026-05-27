import type { Showcase, ShowcaseStatus } from '../../../types'

import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createShowcase, updateShowcase } from '../../../api/adminApi'
import { useErrorDisplay } from '../../../hooks/useErrorDisplay'
import log from '../../../utils/logger'
import { ErrorBanner } from '../../ErrorBanner'
import { STATUS_CONFIG } from '../StatusBadge'

interface CreateOrEditShowcaseModalProps {
  isOpen: boolean
  onClose: () => void
  showcase?: Showcase
  onSuccess?: (showcaseName: string) => void
}

export function CreateOrEditShowcaseModal({ isOpen, onClose, showcase, onSuccess }: CreateOrEditShowcaseModalProps) {
  const auth = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<ShowcaseStatus>('pending')
  const [isLoading, setIsLoading] = useState(false)
  const { error, displayError, dismissError } = useErrorDisplay()

  const isEditMode = !!showcase

  // Pre-populate form when showcase is provided
  useEffect(() => {
    if (isOpen && showcase) {
      setName(showcase.name)
      setDescription(showcase.description || '')
      setStatus(showcase.status || 'pending')
    } else if (isOpen) {
      setName('')
      setDescription('')
      setStatus('pending')
    }
  }, [isOpen, showcase])

  if (!isOpen) return null

  const initializeBaseIntroduction = async (showcaseName: string) => {
    try {
      const introductionScreens = [
        {
          screenId: 'PICK_CHARACTER',
          name: 'Meet the Persona',
          text: 'In this demo, you will use digital credentials from your BC Wallet to complete various tasks.',
        },
        {
          screenId: 'SETUP_START',
          name: "Let's get started!",
          text: 'BC Wallet is a new app for storing and using credentials on your smartphone. Credentials are things like IDs, licenses and diplomas.\nUsing your BC Wallet is fast and simple. In the future it can be used online and in person. You approve every use, and share only what is needed.',
          image: '/public/common/screen/getStarted.svg',
        },
        {
          screenId: 'CHOOSE_WALLET',
          name: 'Install BC Wallet',
          text: 'First, install the BC Wallet app onto your smartphone. Select the button below for instructions and the next step.',
          image: '/public/common/screen/app-store-screenshots.png',
        },
        {
          screenId: 'SETUP_COMPLETED',
          name: "You're all set!",
          text: 'Congratulations! You have successfully completed the onboarding. Your credentials are now ready to be used.',
          image: '/public/common/screen/onboarding-completed-light.svg',
        },
      ]

      const progressBar = [
        {
          name: 'person',
          introductionStep: 'PICK_CHARACTER',
          iconLight: '/public/common/icon/icon-person-light.svg',
          iconDark: '/public/common/icon/icon-person-dark.svg',
        },
        {
          name: 'moon',
          introductionStep: 'SETUP_START',
          iconLight: '/public/common/icon/icon-moon-light.svg',
          iconDark: '/public/common/icon/icon-moon-dark.svg',
        },
        {
          name: 'wallet',
          introductionStep: 'CHOOSE_WALLET',
          iconLight: '/public/common/icon/icon-wallet-light.svg',
          iconDark: '/public/common/icon/icon-wallet-dark.svg',
        },
        {
          name: 'balloon',
          introductionStep: 'SETUP_COMPLETED',
          iconLight: '/public/common/icon/icon-balloon-light.svg',
          iconDark: '/public/common/icon/icon-balloon-dark.svg',
        },
      ]

      await updateShowcase(auth, showcaseName, {
        introduction: introductionScreens,
        progressBar: progressBar,
      })
    } catch (error) {
      log.error('Failed to initialize base introduction:', error)
      throw error
    }
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      displayError('Please enter a showcase title')
      return
    }

    if (!description.trim()) {
      displayError('Please enter a showcase description')
      return
    }

    try {
      setIsLoading(true)

      if (isEditMode && showcase) {
        // Edit mode
        await updateShowcase(auth, showcase.name, {
          name,
          description,
          status,
        })
        // Trigger refresh after successful update
        onSuccess?.(name)
      } else {
        // Create mode
        const response = await createShowcase(auth, name, description)
        // Initialize base introduction for new showcase
        await initializeBaseIntroduction(response.name)
        onSuccess?.(response.name)
      }

      // Reset form and close modal
      setName('')
      setDescription('')
      setStatus('pending')
      dismissError()
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} showcase`
      displayError(message)
      log.error(`Error ${isEditMode ? 'updating' : 'creating'} showcase:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  const modalTitle = isEditMode ? 'Edit Showcase' : 'Create New Showcase'
  const modalDescription = isEditMode
    ? 'Update the showcase title and description.'
    : 'Set up a new digital credential showcase with a title and description.'
  const submitButtonText = isEditMode ? (isLoading ? 'Updating...' : 'Update') : isLoading ? 'Creating...' : 'Create'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-l font-semibold text-bcgov-black">{modalTitle}</h2>
            <h5 className="text-gray-500 mt-2">{modalDescription}</h5>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {error && <ErrorBanner error={error} onDismiss={dismissError} />}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Showcase Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          {isEditMode && (
            <div>
              <label className="block text-sm font-semibold text-bcgov-black mb-2">Status</label>
              <div className="flex gap-3">
                {(Object.entries(STATUS_CONFIG) as [ShowcaseStatus, (typeof STATUS_CONFIG)[ShowcaseStatus]][]).map(
                  ([value, config]) => (
                    <button
                      key={value}
                      onClick={() => setStatus(value)}
                      disabled={isLoading}
                      className={`flex-1 px-4 py-2 font-semibold rounded-lg border-2 transition-all ${
                        status === value
                          ? `${config.bgColor} ${config.textColor} border-current shadow-md`
                          : 'bg-white text-bcgov-darkgrey border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      {config.label}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={isLoading || !name.trim() || !description.trim()}
            className="px-4 py-2 bg-bcgov-blue text-white font-semibold rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50"
          >
            {submitButtonText}
          </button>
        </div>
      </div>
    </div>
  )
}
