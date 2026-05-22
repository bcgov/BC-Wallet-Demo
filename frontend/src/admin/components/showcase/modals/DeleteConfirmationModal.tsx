import { TrashIcon } from '@heroicons/react/24/outline'

interface DeleteConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  onCancel: () => void
  onConfirm: () => void
  showIcon?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  description,
  onCancel,
  onConfirm,
  showIcon = true,
}: DeleteConfirmationModalProps) {
  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" />
      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full z-[10000]">
        {showIcon && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-bcgov-black">{title}</h3>
          </div>
        )}
        {!showIcon && <h3 className="text-lg font-semibold text-bcgov-black mb-4">{title}</h3>}
        <p className="text-sm text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </>
  )
}
