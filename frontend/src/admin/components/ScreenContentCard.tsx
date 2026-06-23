import type { Credential } from '../types'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../api/adminApi'
import { useHasRole } from '../hooks/useUserRole'
import { formatScreenId } from '../utils/formatters'

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

function getSafeImagePath(image?: string): string | null {
  if (!image) return null

  const trimmed = image.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  if (trimmed.includes('://')) return null
  if (trimmed.includes('..')) return null

  // Check for potentially dangerous characters
  const dangerousChars = ['<', '>', '"', "'", '`', '\\']
  if (dangerousChars.some((char) => trimmed.includes(char))) return null

  // Check for control characters (0x00-0x1F and 0x7F)
  for (let i = 0; i < trimmed.length; i++) {
    const code = trimmed.charCodeAt(i)
    if ((code >= 0x00 && code <= 0x1f) || code === 0x7f) {
      return null
    }
  }

  return trimmed
}

function buildSafeImageUrl(image?: string): string | null {
  const safePath = getSafeImagePath(image)
  if (!safePath) return null

  const encodedPath = safePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  try {
    return new URL(encodedPath, publicBaseUrl).toString()
  } catch {
    return null
  }
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
  const canEdit = useHasRole('creator')
  const safeImageUrl = buildSafeImageUrl(image)

  const containerClasses = [
    containerClassName,
    isDragging ? 'opacity-50' : '',
    isDragOver ? 'bg-blue-50 border-blue-400' : '',
    draggableId && !disableDrag ? 'cursor-move' : '',
    disableDrag && draggableId ? 'cursor-not-allowed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const textClasses = ['text-xs text-gray-600', textMarginClass].filter(Boolean).join(' ')

  return (
    <div
      draggable={!!draggableId && !disableDrag}
      onDragStart={!disableDrag ? onDragStart : undefined}
      onDragOver={!disableDrag ? onDragOver : undefined}
      onDragLeave={!disableDrag ? onDragLeave : undefined}
      onDrop={!disableDrag ? onDrop : undefined}
      className={containerClasses}
    >
      {canEdit && (
        <button
          onClick={onEdit}
          className="absolute top-3 right-3 z-10 p-2 text-gray-500 hover:text-bcgov-blue transition-colors cursor-pointer rounded hover:bg-gray-200"
          title="Edit screen"
          aria-label="Edit screen"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      )}
      <div className="flex-1">
        <p className="text-sm font-bold text-bcgov-black mb-2">{formatScreenId(screenId)}</p>
        <p className="text-xs font-semibold text-bcgov-black mb-1">{title}</p>
        <p className={textClasses}>{text}</p>
      </div>
      {safeImageUrl && (
        <div className="flex-shrink-0 mr-8">
          <img src={safeImageUrl} alt={title} className="h-40 w-auto object-contain" />
        </div>
      )}
    </div>
  )
}
