import type { Showcase } from '../../types'

import { TrashIcon } from '@heroicons/react/24/outline'

interface TrashShowcaseCardProps {
  showcase: Showcase
  onRestore: () => void
  onPermanentDelete: () => void
}

export function TrashShowcaseCard({ showcase, onRestore, onPermanentDelete }: TrashShowcaseCardProps) {
  const deletedDate = showcase.deleted_at ? new Date(showcase.deleted_at).toLocaleDateString() : 'Unknown date'

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white flex items-center justify-between">
      <div>
        <h3 className="text-bcgov-black font-semibold text-lg">{showcase.name}</h3>
        <p className="text-sm text-bcgov-darkgrey">Deleted {deletedDate}</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRestore}
          className="px-3 py-1.5 text-sm border border-bcgov-blue text-bcgov-blue rounded-lg hover:bg-blue-50 transition-colors font-medium"
        >
          Restore
        </button>
        <button
          onClick={onPermanentDelete}
          className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-1"
        >
          <TrashIcon className="w-4 h-4" />
          Delete Forever
        </button>
      </div>
    </div>
  )
}
