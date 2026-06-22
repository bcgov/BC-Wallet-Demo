import type { ProgressBarStep, IntroductionStep } from '../../../types'
import type { AuthContextProps } from 'react-oidc-context'

import { PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import { publicBaseUrl, deleteScreenFromShowcase } from '../../../api/adminApi'
import { formatScreenId } from '../../../utils/formatters'
import { ErrorBanner } from '../../ErrorBanner'

import { ImageUploadModal } from './ImageUploadModal'

interface CreateOrEditScreenModalProps {
  isOpen: boolean
  onClose: () => void
  screen: IntroductionStep | null
  progressBarStep: ProgressBarStep | null
  isCreate?: boolean
  screenType?: 'introduction' | 'scenarios'
  headerLabel?: string
  disableScreenId?: boolean
  disableDelete?: boolean
  showcaseName?: string
  auth?: AuthContextProps
  onSave: (updatedScreen: IntroductionStep, updatedProgressBar?: ProgressBarStep | null) => void
  onDelete?: () => void | Promise<void>
}

export function CreateOrEditScreenModal({
  isOpen,
  onClose,
  screen,
  progressBarStep,
  isCreate = false,
  screenType = 'introduction',
  headerLabel,
  disableScreenId = false,
  disableDelete = false,
  showcaseName,
  auth,
  onSave,
  onDelete,
}: CreateOrEditScreenModalProps) {
  const [screenId, setScreenId] = useState('')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [image, setImage] = useState('')
  const [iconLight, setIconLight] = useState('')
  const [iconDark, setIconDark] = useState('')
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false)
  const [isIconLightUploadOpen, setIsIconLightUploadOpen] = useState(false)
  const [isIconDarkUploadOpen, setIsIconDarkUploadOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingProgressBar, setIsAddingProgressBar] = useState(false)
  const [isRemovingProgressBar, setIsRemovingProgressBar] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Update state when screen or progressBar props change
  useEffect(() => {
    if (screen) {
      setScreenId(screen.screenId ?? '')
      setTitle(screen.name ?? '')
      setText(screen.text ?? '')
      setImage(screen.image ?? '')
    }
    if (progressBarStep) {
      setIconLight(progressBarStep.iconLight ?? '')
      setIconDark(progressBarStep.iconDark ?? '')
      setIsAddingProgressBar(true)
    } else {
      setIconLight('')
      setIconDark('')
      setIsAddingProgressBar(false)
    }
    setIsRemovingProgressBar(false)
    setShowDeleteConfirm(false)
    setIsDeleting(false)
    setIsSaving(false)
  }, [screen, progressBarStep, isOpen])

  if (!isOpen || !screen) return null

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updatedScreen: IntroductionStep = {
        ...screen,
        screenId: screenId || screen?.screenId || '',
        name: title,
        text,
        image: image || undefined,
      } as IntroductionStep

      // Create or update progressBar
      let updatedProgressBar: ProgressBarStep | undefined | null = undefined
      if (isRemovingProgressBar && progressBarStep) {
        // Signal deletion of existing progress bar
        updatedProgressBar = null
      } else if (progressBarStep) {
        // Updating existing progress bar
        updatedProgressBar = {
          ...progressBarStep,
          iconLight,
          iconDark,
        }
      } else if (isAddingProgressBar && (iconLight || iconDark)) {
        // Creating new progress bar for this screen
        updatedProgressBar = {
          introductionStep: screenId || screen?.screenId || '',
          name: title,
          iconLight,
          iconDark,
        }
      }

      // Call onSave callback - parent component handles closing/transitions
      await onSave(updatedScreen, updatedProgressBar)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save screen'
      setError(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      // Delete the screen from the showcase (only for introduction screens)
      // For scenario screens, the parent component handles deletion
      if (screenType === 'introduction' && showcaseName && auth && screen?.screenId) {
        await deleteScreenFromShowcase(auth, showcaseName, screen.screenId)
      }

      // Call the onDelete callback
      await onDelete?.()

      setShowDeleteConfirm(false)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete screen')
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-l font-semibold text-bcgov-black">
              {headerLabel || (isCreate ? 'Create Screen' : 'Edit Screen')}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <ErrorBanner error={error} onDismiss={() => setError(null)} />

        <div className="p-6 space-y-6">
          {/* Form content starts here */}

          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Screen ID</label>
            <input
              type="text"
              value={formatScreenId(screenId)}
              onChange={(e) => setScreenId(e.target.value)}
              placeholder="Enter screen ID"
              disabled={disableScreenId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-600"
            />
            <p className="text-xs text-gray-500 mt-1">
              Used to identify this screen in the showcase creator. Not shown in the showcase UI.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter screen title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter screen text"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Image</label>
            <div className="flex items-start gap-4">
              <div className="relative group w-fit">
                {image && (
                  <div className="w-24 h-24 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    <img src={`${publicBaseUrl}${image}`} alt="Preview" className="w-full h-full object-contain" />
                    <PencilIcon
                      onClick={() => setIsImageUploadOpen(true)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    />
                  </div>
                )}
              </div>
              {!image && (
                <button
                  onClick={() => setIsImageUploadOpen(true)}
                  className="px-4 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors h-fit"
                >
                  Add Image
                </button>
              )}
            </div>
          </div>

          {screenType === 'introduction' && (
            <div>
              <label className="block text-sm font-semibold text-bcgov-black mb-4">Progress Bar Icons</label>
              {!isAddingProgressBar && !progressBarStep ? (
                <button
                  onClick={() => setIsAddingProgressBar(true)}
                  className="w-1/2 mx-auto block px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors text-sm"
                >
                  + Add Progress Bar Icons
                </button>
              ) : (
                <div>
                  <div className="flex items-start justify-center gap-12">
                    <div>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group w-fit">
                          {iconLight && (
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden bg-gray-100 mb-2">
                                <img
                                  src={`${publicBaseUrl}${iconLight}`}
                                  alt="Light Icon"
                                  className="w-full h-full object-contain"
                                />
                                <PencilIcon
                                  onClick={() => setIsIconLightUploadOpen(true)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                />
                              </div>
                              <p className="text-xs text-gray-500">Light Icon</p>
                            </div>
                          )}
                        </div>
                        {!iconLight && (
                          <button
                            onClick={() => setIsIconLightUploadOpen(true)}
                            className="px-4 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors h-fit"
                          >
                            Add Light Icon
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative group w-fit">
                          {iconDark && (
                            <div className="flex flex-col items-center">
                              <div className="w-16 h-16 border border-gray-300 rounded-lg overflow-hidden bg-gray-100 mb-2">
                                <img
                                  src={`${publicBaseUrl}${iconDark}`}
                                  alt="Dark Icon"
                                  className="w-full h-full object-contain"
                                />
                                <PencilIcon
                                  onClick={() => setIsIconDarkUploadOpen(true)}
                                  className="absolute -top-2 -right-2 w-5 h-5 bg-bcgov-blue text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                />
                              </div>
                              <p className="text-xs text-gray-500">Dark Icon</p>
                            </div>
                          )}
                        </div>
                        {!iconDark && (
                          <button
                            onClick={() => setIsIconDarkUploadOpen(true)}
                            className="px-4 py-2 bg-white text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors h-fit"
                          >
                            Add Dark Icon
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {(isAddingProgressBar || progressBarStep) && !isRemovingProgressBar && (
                    <button
                      onClick={() => setIsRemovingProgressBar(true)}
                      className="w-full px-3 py-2 mt-4 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors text-sm"
                    >
                      Remove Progress Bar Icons
                    </button>
                  )}
                  {isRemovingProgressBar && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 mb-3">Remove progress bar icons for this screen?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsRemovingProgressBar(false)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-bcgov-black font-medium hover:bg-gray-50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingProgressBar(false)
                            setIconLight('')
                            setIconDark('')
                          }}
                          className="flex-1 px-3 py-2 border border-red-300 bg-red-50 rounded-lg text-red-600 font-medium hover:bg-red-100 transition-colors text-sm"
                        >
                          Confirm Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex items-center justify-between gap-3">
          <div>
            {!isCreate && (
              <div className="relative group w-fit">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting || disableDelete}
                  className="px-4 py-2 border border-red-300 rounded-lg text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete Screen
                </button>
                {disableDelete && (
                  <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    <div className="bg-gray-900 text-white text-sm rounded py-2 px-3 whitespace-nowrap relative">
                      This screen is a critical screen, you can only edit.
                      <div className="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isDeleting || isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-bcgov-black font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isDeleting || isSaving}
              className="px-4 py-2 bg-bcgov-blue text-white font-semibold rounded-lg hover:bg-bcgov-blue-dark transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : isCreate ? 'Create Screen' : 'Save Changes'}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-bcgov-black mb-2">Delete Screen?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this screen? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-bcgov-black font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ImageUploadModal
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        type="screen"
        onSelectImage={(imagePath) => {
          setImage(imagePath)
          setIsImageUploadOpen(false)
        }}
      />
      <ImageUploadModal
        isOpen={isIconLightUploadOpen}
        onClose={() => setIsIconLightUploadOpen(false)}
        type="icon"
        onSelectImage={(imagePath) => {
          setIconLight(imagePath)
          setIsIconLightUploadOpen(false)
        }}
      />
      <ImageUploadModal
        isOpen={isIconDarkUploadOpen}
        onClose={() => setIsIconDarkUploadOpen(false)}
        type="icon"
        onSelectImage={(imagePath) => {
          setIconDark(imagePath)
          setIsIconDarkUploadOpen(false)
        }}
      />
    </div>
  )
}
