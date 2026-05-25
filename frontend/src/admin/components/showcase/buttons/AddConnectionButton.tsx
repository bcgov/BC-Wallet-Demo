import { PlusIcon } from '@heroicons/react/24/outline'

interface AddConnectionButtonProps {
  onClick: () => void
  isHidden?: boolean
  containerClassName?: string
  label?: string
}

export function AddConnectionButton({
  onClick,
  isHidden = false,
  containerClassName = '',
  label = 'Add Connection and Issuance Screens',
}: AddConnectionButtonProps) {
  return (
    <div className={`flex gap-6 items-center ${containerClassName}`}>
      <div className="flex-shrink-0 w-12" />
      <button
        onClick={onClick}
        className={`flex-1 py-4 border-2 border-bcgov-blue bg-blue-50 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:bg-blue-100 transition-all duration-200 ${
          isHidden ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
        }`}
        title="Add connection and issuance screens"
      >
        <PlusIcon className="w-6 h-6 text-bcgov-blue font-semibold" />
        <span className="text-base font-semibold text-bcgov-blue">{label}</span>
      </button>
    </div>
  )
}
