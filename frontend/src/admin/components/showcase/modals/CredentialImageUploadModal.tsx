import { XMarkIcon } from '@heroicons/react/24/outline'
import { useRef, useState } from 'react'

import log from '../../../utils/logger'

interface CredentialImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (imagePath: string) => void | Promise<void>
}

export function CredentialImageUploadModal({ isOpen, onClose, onSelectImage }: CredentialImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type - only allow PNG and JPG
    const allowedExtensions = ['.png', '.jpg']
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadError('Please upload an image file (PNG, JPG)')
      return
    }

    // Validate file size (60KB max)
    if (file.size > 60 * 1024) {
      setUploadError('File size must be less than 60KB')
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = reader.result as string
        await onSelectImage(base64String)
      }
      reader.readAsDataURL(file)
      onClose()
    } catch (error) {
      log.error('Error uploading image:', error)
      setUploadError('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-bcgov-black">Upload Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Upload Section */}
        <div className="mb-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-bcgov-blue transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg"
              onChange={handleFileUpload}
              className="hidden"
              id="credential-file-upload"
              disabled={isUploading}
            />
            <p className="text-gray-600 mb-2">
              {isUploading ? 'Uploading...' : 'Click to select an image from your filesystem.'}
            </p>
            <p className="text-xs text-gray-500">Supported formats: PNG, JPG (up to 60KB)</p>
          </div>
          {uploadError && <p className="text-red-500 text-sm mt-2">{uploadError}</p>}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 border border-gray-300 text-bcgov-black font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
