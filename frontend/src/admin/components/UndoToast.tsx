import { XMarkIcon } from '@heroicons/react/24/outline'

interface UndoToastProps {
  visible: boolean
  message: string
  onUndo: () => void
  onDismiss: () => void
}

export function UndoToast({ visible, message, onUndo, onDismiss }: UndoToastProps) {
  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-bcgov-black text-white px-5 py-3 rounded-lg shadow-lg">
      <span className="text-sm">{message}</span>
      <button onClick={onUndo} className="text-sm font-semibold text-yellow-300 hover:underline">
        Undo
      </button>
      <button onClick={onDismiss} aria-label="Dismiss" className="ml-1 text-gray-400 hover:text-white">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
