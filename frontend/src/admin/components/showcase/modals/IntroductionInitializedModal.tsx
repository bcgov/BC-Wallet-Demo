import { XMarkIcon, CheckCircleIcon, PencilIcon, PlusIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'

interface IntroductionInitializedModalProps {
  isOpen: boolean
  onClose: () => void
  showcaseName?: string
}

export function IntroductionInitializedModal({ isOpen, onClose, showcaseName }: IntroductionInitializedModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-semibold text-bcgov-black">Introduction Screens Created</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            Base introduction screens have been created for <span className="font-semibold">{showcaseName}</span>.
          </p>
          <p className="text-gray-600 text-sm mb-6">You can now:</p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <PencilIcon className="w-8 h-8 text-bcgov-blue mb-3" />
              <p className="text-sm text-gray-700 font-medium">Edit Screens</p>
              <p className="text-xs text-gray-500 mt-1">Customize the content</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <PlusIcon className="w-8 h-8 text-bcgov-blue mb-3" />
              <p className="text-sm text-gray-700 font-medium">Add Screens</p>
              <p className="text-xs text-gray-500 mt-1">Expand your showcase</p>
            </div>
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
              <ArrowsPointingOutIcon className="w-8 h-8 text-bcgov-blue mb-3" />
              <p className="text-sm text-gray-700 font-medium">Rearrange</p>
              <p className="text-xs text-gray-500 mt-1">Drag and drop</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
