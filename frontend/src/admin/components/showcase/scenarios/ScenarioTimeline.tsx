import type { ScenarioScreen } from '../../../types'

import { useMemo } from 'react'

import { buildScenarioRows } from '../../../utils/buildScenarioRows'

import { ScenarioScreenRow } from './ScenarioScreenRow'
import { ScenarioSectionHeader } from './ScenarioSectionHeader'

interface ScenarioTimelineProps {
  screens: ScenarioScreen[]
  scenarioId: string
  showcaseName: string
  lineHeight: string
  containerRef: React.RefObject<HTMLDivElement>
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: string | number | null
  setHoverIdx: (idx: string | number | null) => void
  onEditClick: (idx: number, screen: ScenarioScreen) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (idx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (idx: number) => void
  onAddConnectionClick: () => void
  onRefreshShowcase?: () => void | Promise<void>
}

export function ScenarioTimeline({
  screens,
  scenarioId,
  showcaseName,
  lineHeight,
  containerRef,
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
  onAddConnectionClick,
  onRefreshShowcase,
}: ScenarioTimelineProps) {
  const rows = useMemo(() => buildScenarioRows(screens), [screens])

  return (
    <div className="bg-white rounded-lg p-4 relative" ref={containerRef}>
      {/* Vertical connecting line */}
      <div className="absolute left-10 top-8 bg-bcgov-blue z-0" style={{ height: lineHeight, width: '1px' }} />

      {rows.map(({ idx, screen, nextScreen, hasProofChild, isPredefinedScreen }) => (
        <div key={idx}>
          <ScenarioSectionHeader
            screenId={screen.screenId}
            hasConnectionScreens={screens.some((s) => s.screenId === 'CONNECTION')}
            onAddConnectionClick={onAddConnectionClick}
          />

          <ScenarioScreenRow
            screen={screen}
            nextScreen={nextScreen}
            idx={idx}
            scenarioId={scenarioId}
            showcaseName={showcaseName}
            screensLength={screens.length}
            hasProofChild={hasProofChild}
            isPredefinedScreen={isPredefinedScreen}
            draggedIdx={draggedIdx}
            dragOverIdx={dragOverIdx}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            onEditClick={onEditClick}
            onAddScreenClick={onAddScreenClick}
            onShowDeleteConfirm={onShowDeleteConfirm}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onRefreshShowcase={onRefreshShowcase}
          />
        </div>
      ))}
    </div>
  )
}
