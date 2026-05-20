import type { Showcase, IntroductionStep } from '../../types'

import { buildIntroductionRows } from '../../utils/buildIntroductionRows'

import { IntroductionScreenRow } from './IntroductionScreenRow'
import { IntroductionSectionHeader } from './IntroductionSectionHeader'

interface IntroductionTimelineProps {
  introduction: IntroductionStep[]
  showcase: Showcase
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: number | null
  setHoverIdx: (idx: number | null) => void
  lineHeight: string
  containerRef: React.RefObject<HTMLDivElement>
  onEditClick: (idx: number, screen: IntroductionStep) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (connectIdx: number) => void
  onDrop: (dropIdx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onSelectCredential: () => void
}

export function IntroductionTimeline({
  introduction,
  showcase,
  draggedIdx,
  dragOverIdx,
  hoverIdx,
  setHoverIdx,
  lineHeight,
  containerRef,
  onEditClick,
  onAddScreenClick,
  onShowDeleteConfirm,
  onDrop,
  onDragStart,
  onDragOver,
  onDragLeave,
  onSelectCredential,
}: IntroductionTimelineProps) {
  const rows = buildIntroductionRows(introduction, showcase.progressBar)

  return (
    <div className="bg-white rounded-lg p-4 relative" ref={containerRef}>
      {/* Vertical connecting line */}
      <div className="absolute left-10 top-8 bg-bcgov-blue z-0" style={{ height: lineHeight, width: '1px' }} />
      {rows.map((row) => (
        <div key={row.idx}>
          <IntroductionSectionHeader
            screenId={row.screen.screenId}
            isFirstConnectScreen={row.isFirstConnectScreen}
            hasConnectScreens={introduction?.some((s) => s.screenId.startsWith('CONNECT')) ?? false}
            onSelectCredential={onSelectCredential}
          />
          <IntroductionScreenRow
            row={row}
            introduction={introduction}
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            onEditClick={onEditClick}
            onAddScreenClick={onAddScreenClick}
            onShowDeleteConfirm={onShowDeleteConfirm}
            onDrop={onDrop}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onSelectCredential={onSelectCredential}
          />
        </div>
      ))}
    </div>
  )
}
