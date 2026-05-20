import type { ScenarioScreen } from '../../../types'

import { ScenarioScreenRow } from './ScenarioScreenRow'
import { ScenarioSectionHeader } from './ScenarioSectionHeader'

interface ScenarioTimelineProps {
  screens: ScenarioScreen[]
  scenarioId: string
  lineHeight: string
  containerRef: React.RefObject<HTMLDivElement>
  draggedIdx: number | null
  dragOverIdx: number | null
  hoverIdx: string | null
  setHoverIdx: (idx: string | null) => void
  onEditClick: (idx: number, screen: ScenarioScreen) => void
  onAddScreenClick: (afterIdx: number) => void
  onShowDeleteConfirm: (idx: number) => void
  onDragStart: (idx: number) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: () => void
  onDrop: (idx: number) => void
  onAddConnectionClick: () => void
}

export function ScenarioTimeline({
  screens,
  scenarioId,
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
}: ScenarioTimelineProps) {
  return (
    <div className="bg-white rounded-lg p-4 relative" ref={containerRef}>
      {/* Vertical connecting line */}
      <div className="absolute left-10 top-8 bg-bcgov-blue z-0" style={{ height: lineHeight, width: '1px' }} />

      {screens.map((screen, idx) => {
        // Skip PROOF screens as they're rendered within CONNECTION blocks
        const prevScreen = idx > 0 ? screens[idx - 1] : null
        if (screen.screenId === 'PROOF' && prevScreen?.screenId === 'CONNECTION') {
          return null
        }

        // Check if this CONNECTION screen has a PROOF child
        const nextScreen = idx + 1 < screens.length ? screens[idx + 1] : undefined
        const hasProofChild = screen.screenId === 'CONNECTION' && nextScreen?.screenId === 'PROOF'

        // Check if screen is a predefined system screen (not draggable)
        const isPredefinedScreen =
          screen.screenId === 'START' ||
          screen.screenId === 'CONNECTION' ||
          screen.screenId === 'PROOF' ||
          screen.screenId === 'STEP_END'

        return (
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
            />
          </div>
        )
      })}
    </div>
  )
}
