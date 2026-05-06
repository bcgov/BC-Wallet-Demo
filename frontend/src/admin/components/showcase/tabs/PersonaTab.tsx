import type { Showcase } from '../../../types'

import { ArrowUpTrayIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, updateShowcase } from '../../../api/adminApi'
import { ImageUploadModal } from '../../ImageUploadModal'

interface PersonaTabProps {
  showcase: Showcase
  isLoading: boolean
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
}

export function PersonaTab({ showcase, isLoading, isNewShowcase, onTabChange, onRefresh }: PersonaTabProps) {
  const auth = useAuth()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState(showcase.persona?.name || '')
  const [isEditingRole, setIsEditingRole] = useState(false)
  const [roleValue, setRoleValue] = useState(showcase.persona?.type || '')
  const [isImageUploadModalOpen, setIsImageUploadModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [localShowcase, setLocalShowcase] = useState(showcase)

  useEffect(() => {
    if (showcase) {
      // Only update form values if they match the showcase values (i.e., no unsaved changes)
      if (titleValue === (localShowcase.persona?.name || '')) {
        setTitleValue(showcase.persona?.name || '')
      }
      if (roleValue === (localShowcase.persona?.type || '')) {
        setRoleValue(showcase.persona?.type || '')
      }
      setLocalShowcase(showcase)
    }
  }, [showcase])

  const handleSave = async () => {
    if (!showcase || !auth.user?.access_token) return

    setSaveError(null)
    setIsSaving(true)

    try {
      await updateShowcase(auth, showcase.name, {
        persona: {
          ...showcase.persona,
          name: titleValue,
          type: roleValue,
        },
      })

      // Clear editing states after successful save
      setIsEditingTitle(false)
      setIsEditingRole(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while saving'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNextStep = async () => {
    if (!showcase || !auth.user?.access_token) return

    setSaveError(null)
    setIsSaving(true)

    try {
      await updateShowcase(auth, showcase.name, {
        persona: {
          ...showcase.persona,
          name: titleValue,
          type: roleValue,
        },
      })

      // Switch to credentials tab
      onTabChange?.('credentials')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while saving'
      setSaveError(message)
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
        {(titleValue !== showcase.persona?.name || roleValue !== showcase.persona?.type) && (
          <div className="flex flex-col gap-2 items-end">
            {saveError && <p className="text-red-600 text-xs">{saveError}</p>}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
      <div className="w-full max-w-4xl px-6 border border-gray-300 rounded-lg bg-white p-8">
        {/* Title Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Title</label>
          <div className="relative group">
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              disabled={isLoading}
              readOnly={!isEditingTitle && !isNewShowcase}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue ${
                isEditingTitle || isNewShowcase ? 'bg-white text-bcgov-black' : 'bg-gray-100 text-gray-500'
              }`}
            />
            <PencilIcon
              onClick={() => setIsEditingTitle(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            />
          </div>
        </div>

        {/* Role Section */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-bcgov-black mb-2">Role</label>
          <div className="relative group">
            <input
              type="text"
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
              disabled={isLoading}
              readOnly={!isEditingRole && !isNewShowcase}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue ${
                isEditingRole || isNewShowcase ? 'bg-white text-bcgov-black' : 'bg-gray-100 text-gray-500'
              }`}
            />
            <PencilIcon
              onClick={() => setIsEditingRole(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            />
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
                <PencilIcon
                  onClick={() => setIsImageUploadModalOpen(true)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                />
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
            disabled={isSaving}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Next Step'}
          </button>
        </div>
      )}
      <ImageUploadModal
        isOpen={isImageUploadModalOpen}
        onClose={() => setIsImageUploadModalOpen(false)}
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
