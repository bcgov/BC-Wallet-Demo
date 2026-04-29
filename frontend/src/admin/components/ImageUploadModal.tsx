import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, getAvailableSvgs, uploadSvg } from '../api/adminApi'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (imagePath: string) => void
}

export function ImageUploadModal({ isOpen, onClose, onSelectImage }: ImageUploadModalProps) {
  const auth = useAuth()
  const [availableImages, setAvailableImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const loadAvailableImages = async () => {
    setIsLoading(true)
    try {
      const images = await getAvailableSvgs(auth)
      setAvailableImages(images)
      setUploadError(null)
    } catch {
      setUploadError('Failed to load available images')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadAvailableImages()
    }
  }, [isOpen])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.svg')) {
      setUploadError('Please upload an SVG file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    // Upload file
    try {
      const result = await uploadSvg(auth, file)
      onSelectImage(result.path)
      onClose()
    } catch {
      setUploadError('Failed to upload file')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-bcgov-black">Upload Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Available Images Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-bcgov-black mb-4">Select from available images</h3>
          {isLoading ? (
            <p className="text-gray-500">Loading images...</p>
          ) : availableImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {availableImages.map((imagePath) => (
                <button
                  key={imagePath}
                  onClick={() => {
                    onSelectImage(imagePath)
                    onClose()
                  }}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 rounded-lg hover:border-bcgov-blue transition-colors bg-gray-50 h-40"
                >
                  <img src={`${publicBaseUrl}${imagePath}`} alt={imagePath} className="w-20 h-20 object-contain mb-2" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No images available</p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-8"></div>

        {/* Upload Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-bcgov-black mb-4">Or upload a new image</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" accept=".svg" onChange={handleFileUpload} className="hidden" id="file-upload" />
            <label htmlFor="file-upload" className="cursor-pointer">
              <p className="text-gray-600 mb-2">Drag and drop your SVG file here, or click to select</p>
              <p className="text-xs text-gray-500">SVG files up to 5MB</p>
            </label>
          </div>
          {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-bcgov-black font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
