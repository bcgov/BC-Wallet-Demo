import type { Credential, CustomRequestOptions } from '../types'

import { CreditCardIcon, Cog6ToothIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../api/adminApi'
import { formatScreenId } from '../utils/formatScreenId'

interface ScreenContentCardProps {
  screenId: string
  title: string
  text: string
  image?: string
  credentials?: Credential[]
  requestOptions?: CustomRequestOptions
  onEdit: () => void
  containerClassName?: string
  textMarginClass?: string
  draggableId?: string
  isDragging?: boolean
  isDragOver?: boolean
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
  credentials,
  requestOptions,
  onEdit,
  containerClassName = 'flex-1 border border-gray-300 rounded-lg bg-white p-8 flex items-center justify-between gap-6 relative',
  textMarginClass = 'mb-3',
  draggableId,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: ScreenContentCardProps) {
  return (
    <div
      draggable={!!draggableId}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`${containerClassName} ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'bg-blue-50 border-blue-400' : ''} ${draggableId ? 'cursor-move' : ''}`}
    >
      <button onClick={onEdit} className="absolute top-3 right-3 text-gray-500 hover:text-bcgov-blue transition-colors">
        <Cog6ToothIcon className="w-5 h-5" />
      </button>
      <div className="flex-1">
        <p className="text-sm font-bold text-bcgov-black mb-2">{formatScreenId(screenId)}</p>
        <p className="text-xs font-semibold text-bcgov-black mb-1">{title}</p>
        <p className={`text-xs text-gray-600 ${textMarginClass}`}>{text}</p>
        {credentials && credentials.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {credentials.map((cred, credIdx) => (
              <div
                key={credIdx}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
              >
                <CreditCardIcon className="w-3 h-3" />
                {cred.name}
              </div>
            ))}
          </div>
        )}
        {requestOptions && requestOptions.requestedCredentials && requestOptions.requestedCredentials.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <CheckBadgeIcon className="w-3 h-3" />
              {requestOptions.title || `Request (${requestOptions.requestedCredentials.length} credentials)`}
            </div>
          </div>
        )}
      </div>
      {image && (
        <div className="flex-shrink-0">
          <img src={`${publicBaseUrl}${image}`} alt={title} className="h-40 w-auto object-contain" />
        </div>
      )}
    </div>
  )
}
