import { TrashIcon } from '@heroicons/react/24/outline'

interface DeleteScreenPairButtonProps {
  isVisible: boolean
  onDelete: (index: number) => void
  index: number
  title: string
  className?: string
}

export function DeleteScreenPairButton({
  isVisible,
  onDelete,
  index,
  title,
  className = '',
}: DeleteScreenPairButtonProps) {
  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onDelete(index)
      }}
      className={`absolute top-2 right-2 p-2 text-red-600 hover:bg-red-50 rounded transition-colors ${className}`}
      title={title}
      type="button"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  )
}
