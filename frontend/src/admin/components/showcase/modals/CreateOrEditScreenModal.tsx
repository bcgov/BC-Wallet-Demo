import { PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'

import { publicBaseUrl } from '../../../api/adminApi'
import { formatScreenId, type CustomCharacter, type OnboardingStep } from '../../../types'
import { ImageUploadModal } from '../../ImageUploadModal'

interface ProgressBar {
  name: string
  onboardingStep: string
  iconLight: string
  iconDark: string
}

interface CreateOrEditScreenModalProps {
  isOpen: boolean
  onClose: () => void
  screen: OnboardingStep | null
  progressBar: ProgressBar | null
  character: CustomCharacter | null
  isCreate?: boolean
  onSave: (updatedScreen: OnboardingStep, updatedProgressBar?: ProgressBar) => void
}

export function CreateOrEditScreenModal({
  isOpen,
  onClose,
  screen,
  progressBar,
  isCreate = false,
  onSave,
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

  // Update state when screen or progressBar props change
  useEffect(() => {
    if (screen) {
      setScreenId(screen.screenId ?? '')
      setTitle(screen.title ?? '')
      setText(screen.text ?? '')
      setImage(screen.image ?? '')
    }
    if (progressBar) {
      setIconLight(progressBar.iconLight ?? '')
      setIconDark(progressBar.iconDark ?? '')
    }
  }, [screen, progressBar, isOpen])

  if (!isOpen || !screen) return null

  const handleSave = () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    const updatedScreen: OnboardingStep = {
      ...screen,
      screenId: screenId || screen?.screenId || '',
      title,
      text,
      image: image || undefined,
    } as OnboardingStep

    const updatedProgressBar = progressBar
      ? {
          ...progressBar,
          iconLight,
          iconDark,
        }
      : undefined

    onSave(updatedScreen, updatedProgressBar)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-l font-semibold text-bcgov-black">{isCreate ? 'Create Screen' : 'Edit Screen'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-bcgov-black mb-2">Screen ID</label>
            <input
              type="text"
              value={formatScreenId(screenId)}
              onChange={(e) => setScreenId(e.target.value)}
              placeholder="Enter screen ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bcgov-blue"
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

          {progressBar && (
            <div>
              <label className="block text-sm font-semibold text-bcgov-black mb-4">Progress Bar Icons</label>
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
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-bcgov-black font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-bcgov-blue text-white font-semibold rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            {isCreate ? 'Create Screen' : 'Save Changes'}
          </button>
        </div>
      </div>

      <ImageUploadModal
        isOpen={isImageUploadOpen}
        onClose={() => setIsImageUploadOpen(false)}
        onSelectImage={(imagePath) => {
          setImage(imagePath)
          setIsImageUploadOpen(false)
        }}
      />
      <ImageUploadModal
        isOpen={isIconLightUploadOpen}
        onClose={() => setIsIconLightUploadOpen(false)}
        onSelectImage={(imagePath) => {
          setIconLight(imagePath)
          setIsIconLightUploadOpen(false)
        }}
      />
      <ImageUploadModal
        isOpen={isIconDarkUploadOpen}
        onClose={() => setIsIconDarkUploadOpen(false)}
        onSelectImage={(imagePath) => {
          setIconDark(imagePath)
          setIsIconDarkUploadOpen(false)
        }}
      />
    </div>
  )
}
