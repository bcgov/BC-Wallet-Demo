import type { ReactNode } from 'react'

import { PlusIcon } from '@heroicons/react/24/outline'

import { useHasRole } from '../../hooks/useUserRole'
import { ScreenContentCard } from '../ScreenContentCard'

import { DeleteScreenPairButton } from './buttons/DeleteScreenPairButton'

interface ScreenRowBaseProps<T extends { screenId: string; name: string; text: string; image?: string }> {
  screen: T
  nextScreen?: T
  idx: number
  screensLength: number
  hasChild: boolean
  childContent?: ReactNode
  headerContent?: ReactNode
  isPredefinedScreen: boolean
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: string | number | null
  setHoverIdx: (idx: string | number | null) => void
  onEditClick: (idx: number, screen: T) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (idx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (idx: number) => void
  draggableId?: string
  containerClassName?: string
  childContainerClassName?: string
  disableDragStart?: boolean
  deleteTitle?: string
  hoverIdPrefix?: string
  skipIconPlaceholder?: boolean
  showAddButton?: boolean
}

export function ScreenRowBase<T extends { screenId: string; name: string; text: string; image?: string }>({
  screen,
  nextScreen,
  idx,
  screensLength,
  hasChild,
  childContent,
  headerContent,
  isPredefinedScreen,
  draggedIdx,
  dragOverIdx,
  hoverIdx,
  setHoverIdx,
  onEditClick,
  onAddScreenClick,
  onShowDeleteConfirm,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  draggableId = `screen-${idx}`,
  childContainerClassName = 'border border-gray-300 rounded-lg bg-gray-100 p-8 relative flex items-center justify-between gap-6',
  disableDragStart = false,
  deleteTitle = 'Delete screens',
  hoverIdPrefix = '',
  skipIconPlaceholder = false,
  showAddButton = true,
}: ScreenRowBaseProps<T>) {
  const canEdit = useHasRole('creator')

  const handleScreenDragStart = () => {
    if (isPredefinedScreen || disableDragStart) return
    onDragStart(idx)
  }

  const hoverIdValue = hoverIdPrefix ? `${hoverIdPrefix}-${idx}` : idx

  return (
    <div className="mt-2">
      <div className="flex gap-6 items-center">
        {/* Placeholder for icon alignment */}
        {!skipIconPlaceholder && <div className="flex-shrink-0 w-12" />}

        {/* Outer container for screen pair */}
        <div className={`flex-1 ${hasChild ? 'border border-gray-200 rounded-lg p-4 bg-gray-50 relative' : ''}`}>
          {/* Delete button for screen pair */}
          <DeleteScreenPairButton
            isVisible={canEdit && hasChild}
            onDelete={onShowDeleteConfirm}
            index={idx}
            title={deleteTitle}
            className="z-10"
          />

          {/* Header content (e.g., issuer/verifier label) */}
          {headerContent}

          {/* Main Screen Content */}
          <div className="flex gap-6 items-center">
            <div className="flex-1">
              <ScreenContentCard
                draggableId={draggableId}
                screenId={screen.screenId}
                title={screen.name}
                text={screen.text}
                image={screen.image}
                onEdit={() => onEditClick(idx, screen)}
                isDragging={draggedIdx === idx}
                isDragOver={dragOverIdx === idx}
                disableDrag={isPredefinedScreen || disableDragStart}
                onDragStart={handleScreenDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop(idx)}
                containerClassName={`flex-1 rounded-lg ${hasChild ? 'bg-gray-100' : 'bg-gray-50'} p-8 relative flex items-center justify-between gap-6 border border-gray-300`}
                textMarginClass=""
              />
            </div>
          </div>

          {/* Render child screen if it exists */}
          {hasChild && nextScreen && (
            <div className="mt-4">
              <div className="flex gap-6 items-center">
                <div className="flex-1">
                  <ScreenContentCard
                    draggableId={`${draggableId}-child`}
                    screenId={nextScreen.screenId}
                    title={nextScreen.name}
                    text={nextScreen.text}
                    image={nextScreen.image}
                    onEdit={() => onEditClick(idx + 1, nextScreen)}
                    isDragging={draggedIdx === idx + 1}
                    isDragOver={dragOverIdx === idx + 1}
                    disableDrag={true}
                    onDragStart={() => {}}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={() => onDrop(idx + 1)}
                    containerClassName={childContainerClassName}
                    textMarginClass=""
                  />
                </div>
              </div>

              {/* Custom child content */}
              {childContent}
            </div>
          )}
        </div>
      </div>

      {/* Hover area to add new screen below */}
      {showAddButton && idx !== screensLength - 1 && !(hasChild && idx + 1 === screensLength - 1) && (
        <div
          className="flex gap-6 items-center mt-2"
          onMouseEnter={() => setHoverIdx(hoverIdValue)}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {!skipIconPlaceholder && <div className="flex-shrink-0 w-12" />}
          <button
            onClick={() => onAddScreenClick(idx + (hasChild ? 1 : 0))}
            className={`flex-1 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-transparent flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-bcgov-blue transition-all duration-200 ${
              hoverIdx === hoverIdValue ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            title="Add screen"
          >
            <PlusIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Add screen</span>
          </button>
        </div>
      )}
    </div>
  )
}
