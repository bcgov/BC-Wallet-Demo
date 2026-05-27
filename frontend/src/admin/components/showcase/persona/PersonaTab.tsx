import type { Showcase } from '../../../types'

import { ArrowUpTrayIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, updateShowcase } from '../../../api/adminApi'
import { useErrorDisplay } from '../../../hooks/useErrorDisplay'
import { useHasRole } from '../../../hooks/useUserRole'
import log from '../../../utils/logger'
import { ErrorBanner } from '../../ErrorBanner'
import { ImageUploadModal } from '../modals/ImageUploadModal'

interface PersonaTabProps {
  showcase: Showcase
  isLoading: boolean
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
}

export function PersonaTab({ showcase, isLoading, isNewShowcase, onTabChange, onRefresh }: PersonaTabProps) {
  const auth = useAuth()
  const canEdit = useHasRole('creator')
  const [isEditingName, setIsEditingName] = useState(false)
  const [name, setName] = useState(showcase.persona?.name || '')
  const [isEditingType, setIsEditingType] = useState(false)
  const [personaType, setPersonaType] = useState(showcase.persona?.type || '')
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [localShowcase, setLocalShowcase] = useState(showcase)
  const { error: saveError, displayError, dismissError } = useErrorDisplay()

  useEffect(() => {
    if (showcase) {
      // Only update form values if they match the showcase values (i.e., no unsaved changes)
      if (name === (localShowcase.persona?.name || '')) {
        setName(showcase.persona?.name || '')
      }
      if (personaType === (localShowcase.persona?.type || '')) {
        setPersonaType(showcase.persona?.type || '')
      }
      setLocalShowcase(showcase)
    }
  }, [showcase])

  const handleSave = async () => {
    if (!showcase || !auth.user?.access_token) return

    if (!name.trim()) {
      displayError('Please enter a persona name')
      return
    }

    if (!personaType.trim()) {
      displayError('Please enter a persona type')
      return
    }

    setIsSaving(true)

    try {
      await updateShowcase(auth, showcase.name, {
        persona: {
          ...showcase.persona,
          name: name,
          type: personaType,
        },
      })

      // Clear editing states after successful save
      setIsEditingName(false)
      setIsEditingType(false)
      dismissError()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while saving'
      displayError(message)
      log.error('Error saving persona:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateIntroductionWithPersona = async () => {
    if (!showcase || !auth.user?.access_token || !showcase.introduction?.length) {
      return
    }

    try {
      // Update the first introduction screen with the persona info
      const updatedIntroduction = showcase.introduction.map((screen) => {
        if (screen.screenId === 'PICK_CHARACTER') {
          return {
            ...screen,
            name: `Meet ${name}`,
            text: `${name} is a ${personaType}. In this demo, ${name} will use digital credentials from their BC Wallet to complete various tasks.`,
          }
        }
        return screen
      })

      await updateShowcase(auth, showcase.name, {
        introduction: updatedIntroduction,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update introduction'
      displayError(message)
      log.error('Failed to update introduction with persona:', error)
    }
  }

  const handleNextStep = async () => {
    if (!showcase || !auth.user?.access_token) return

    if (!name.trim()) {
      displayError('Please enter a persona name')
      return
    }

    if (!personaType.trim()) {
      displayError('Please enter a persona type')
      return
    }

    if (!localShowcase.persona?.image) {
      displayError('Please upload a persona image')
      return
    }

    setIsSaving(true)

    try {
      await updateShowcase(auth, showcase.name, {
        persona: {
          ...showcase.persona,
          name: name,
          type: personaType,
        },
      })

      // Update introduction screens with persona details
      await updateIntroductionWithPersona()
      dismissError()
      onTabChange?.('introduction')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while saving'
      displayError(message)
      log.error('Error saving persona:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUpdated = () => {
    // Refresh the showcase to get the latest data
    onRefresh?.()
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Persona Tab */}
      <div className="w-full max-w-4xl mb-8 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-bcgov-black">Setup Persona</h2>
          <h5 className="text-gray-500 mt-2">
            Configure the details for your persona. This will be the credential holder going through the showcase.
          </h5>
        </div>
        {(name !== showcase.persona?.name || personaType !== showcase.persona?.type) && (
          <div className="flex flex-col gap-2 items-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim() || !personaType.trim()}
              className="px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      {saveError && (
        <div className="w-full max-w-4xl mb-6">
          <ErrorBanner error={saveError} onDismiss={dismissError} title="Error saving persona" variant="left-border" />
        </div>
      )}
      <div className="w-full max-w-4xl px-6 border border-gray-300 rounded-lg bg-white p-8">
        {/* Title Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Name</label>
          <div className="relative group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              readOnly={!isEditingName && !isNewShowcase}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue ${
                isEditingName || isNewShowcase ? 'bg-white text-bcgov-black' : 'bg-gray-100 text-gray-500'
              }`}
            />
            {canEdit && (
              <PencilIcon
                onClick={() => setIsEditingName(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Type Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Type</label>
          <div className="relative group">
            <input
              type="text"
              value={personaType}
              onChange={(e) => setPersonaType(e.target.value)}
              disabled={isLoading}
              readOnly={!isEditingType && !isNewShowcase}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue ${
                isEditingType || isNewShowcase ? 'bg-white text-bcgov-black' : 'bg-gray-100 text-gray-500'
              }`}
            />
            {canEdit && (
              <PencilIcon
                onClick={() => setIsEditingType(true)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              />
            )}
          </div>
        </div>

        {/* Image Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Image</label>
          <div className="relative group w-fit">
            {localShowcase.persona?.image ? (
              <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={`${publicBaseUrl}${localShowcase.persona?.image}`}
                  alt={localShowcase.persona?.name}
                  className="w-full h-full object-contain"
                />
                {canEdit && (
                  <PencilIcon
                    onClick={() => setIsImageUploadModalOpen(true)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  />
                )}
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
      </div>
      {isNewShowcase && (
        <div className="w-full max-w-4xl mt-8 px-6 flex justify-center">
          <button
            onClick={handleNextStep}
            disabled={isSaving || !name.trim() || !personaType.trim() || !localShowcase.persona?.image}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Next Step'}
          </button>
        </div>
      )}
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
        type="persona"
        onSelectImage={() => {}}
        showcase={localShowcase}
        propertyPath="persona.image"
        onImageUpdated={() => {
          handleImageUpdated()
        }}
      />
    </div>
  )
}
