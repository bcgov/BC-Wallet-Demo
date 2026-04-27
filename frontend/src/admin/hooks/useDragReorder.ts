import { useState } from 'react'

interface UseDragReorderReturn {
  draggedIdx: number | null
  dragOverIdx: number | null
  handleDragStart: (idx: number) => void
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  handleDragLeave: () => void
  setDraggedIdx: (idx: number | null) => void
  setDragOverIdx: (idx: number | null) => void
}

/**
 * Custom hook for managing drag and reorder state
 * Provides common drag handlers and state management
 */
export function useDragReorder(): UseDragReorderReturn {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragLeave = () => {
    setDragOverIdx(null)
  }

  return {
    draggedIdx,
    dragOverIdx,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    setDraggedIdx,
    setDragOverIdx,
  }
}
