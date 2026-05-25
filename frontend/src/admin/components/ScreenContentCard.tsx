import type { Credential } from '../types'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../api/adminApi'
import { formatScreenId } from '../utils/formatScreenId'

interface ScreenContentCardProps {
  screenId: string
  title: string
  text: string
  image?: string
  credentials?: Credential[]
  onEdit: () => void
  containerClassName?: string
  textMarginClass?: string
  draggableId?: string
  isDragging?: boolean
  isDragOver?: boolean
  disableDrag?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void
}

export function ScreenContentCard({
  screenId,
  title,
  text,
  image,
  onEdit,
  containerClassName = 'flex-1 border border-gray-300 rounded-lg bg-white p-8 flex items-center justify-between gap-6 relative',
  textMarginClass = 'mb-3',
  draggableId,
  isDragging = false,
  isDragOver = false,
  disableDrag = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: ScreenContentCardProps) {
  return (
    <div
      draggable={!!draggableId && !disableDrag}
      onDragStart={!disableDrag ? onDragStart : undefined}
      onDragOver={!disableDrag ? onDragOver : undefined}
      onDragLeave={!disableDrag ? onDragLeave : undefined}
      onDrop={!disableDrag ? onDrop : undefined}
      className={`${containerClassName} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-blue-50 border-blue-400' : ''} ${draggableId && !disableDrag ? 'cursor-move' : ''} ${disableDrag && draggableId ? 'cursor-not-allowed' : ''}`}
    >
      <button
        onClick={onEdit}
        className="absolute top-3 right-3 z-10 p-2 text-gray-500 hover:text-bcgov-blue transition-colors cursor-pointer rounded hover:bg-gray-200"
        title="Edit screen"
        aria-label="Edit screen"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-bold text-bcgov-black mb-2">{formatScreenId(screenId)}</p>
        <p className="text-xs font-semibold text-bcgov-black mb-1">{title}</p>
        <p className={`text-xs text-gray-600 ${textMarginClass}`}>{text}</p>
      </div>
      {image && (
        <div className="flex-shrink-0 mr-8">
          <img src={`${publicBaseUrl}${image}`} alt={title} className="h-40 w-auto object-contain" />
        </div>
      )}
    </div>
  )
}
