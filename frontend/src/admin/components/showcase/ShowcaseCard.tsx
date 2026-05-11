import type { Showcase } from '../../types'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { StatusBadge } from './StatusBadge'
import { CreateOrEditShowcaseModal } from './modals/CreateOrEditShowcaseModal'

interface ShowcaseCardProps {
  showcase: Showcase
  onClick: () => void
  onRefresh?: () => void | Promise<void>
}

export function ShowcaseCard({ showcase, onClick, onRefresh }: ShowcaseCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="absolute top-3 right-3 z-10 p-2 text-gray-500 hover:text-bcgov-blue transition-colors cursor-pointer rounded hover:bg-gray-100"
          title="Edit showcase"
          aria-label="Edit showcase"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
        <button
          onClick={onClick}
          className="w-full text-left border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-bcgov-black font-semibold text-lg">{showcase.name as string}</h3>
                <StatusBadge status={showcase.status} />
              </div>
              <p className="text-bcgov-darkgrey">{showcase.description as string}</p>
            </div>
          </div>
        </button>
      </div>
      <CreateOrEditShowcaseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        showcase={showcase}
        onSuccess={() => {
          void onRefresh?.()
        }}
      />
    </>
  )
}
