import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface PreviewToggleButtonProps {
  isExpanded: boolean
  onToggle: () => void
}

export function PreviewToggleButton({ isExpanded, onToggle }: PreviewToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="px-4 py-2 bg-gray-100 text-bcgov-black font-medium rounded-lg border border-gray-300 hover:bg-gray-200 transition-colors flex items-center gap-2"
      title={isExpanded ? 'Hide preview' : 'Show preview'}
    >
      {isExpanded ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
      Preview
    </button>
  )
}
