import type { ScenarioScreen } from '../../../types'

import { publicBaseUrl } from '../../../api/adminApi'
import { useHasRole } from '../../../hooks/useUserRole'
import { ScreenRowBase } from '../ScreenRowBase'

interface ScenarioScreenRowProps {
  screen: ScenarioScreen
  nextScreen?: ScenarioScreen
  idx: number
  scenarioId: string
  screensLength: number
  hasProofChild: boolean
  isPredefinedScreen: boolean
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
}

export function ScenarioScreenRow({
  screen,
  nextScreen,
  idx,
  scenarioId,
  screensLength,
  hasProofChild,
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
}: ScenarioScreenRowProps) {
  const canEdit = useHasRole('creator')

  return (
    <ScreenRowBase<ScenarioScreen>
      screen={screen}
      nextScreen={nextScreen}
      idx={idx}
      screensLength={screensLength}
      hasChild={hasProofChild}
      headerContent={
        screen.screenId === 'CONNECTION' && screen.verifier?.name ? (
          <div className="mb-3 px-2">
            <p className="text-sm font-semibold text-bcgov-black">{screen.verifier.name}</p>
          </div>
        ) : null
      }
      childContent={
        hasProofChild && nextScreen?.requestOptions ? (
          <div className="mt-4 pt-4 border-t border-gray-300">
            <p className="text-xs font-semibold text-bcgov-black mb-3">Proof Requests</p>
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-bcgov-black mb-2">{nextScreen.requestOptions.name}</h4>
              <p className="text-xs text-gray-600 mb-4">{nextScreen.requestOptions.text}</p>

              {nextScreen.requestOptions.requestedCredentials &&
                nextScreen.requestOptions.requestedCredentials.length > 0 && (
                  <div className="space-y-2">
                    {nextScreen.requestOptions.requestedCredentials.map((cred, credIdx) => (
                      <div key={credIdx} className="bg-white rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {cred.icon && (
                            <img
                              src={`${publicBaseUrl}${cred.icon}`}
                              alt={cred.name}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <span className="text-sm font-medium text-bcgov-black">{cred.name}</span>
                        </div>
                        {cred.schema_id && (
                          <p className="text-xs text-gray-500 mb-2 font-mono break-all">{cred.schema_id}</p>
                        )}
                        {cred.properties && cred.properties.length > 0 && (
                          <div className="text-xs space-y-1 ml-2">
                            <p className="font-semibold text-gray-700">Properties:</p>
                            {cred.properties.map((prop, propIdx) => (
                              <div key={propIdx} className="text-gray-600 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {prop}
                              </div>
                            ))}
                          </div>
                        )}
                        {cred.predicates && cred.predicates.length > 0 && (
                          <div className="text-xs space-y-1 ml-2 mt-2">
                            <p className="font-semibold text-gray-700">Predicates:</p>
                            {cred.predicates.map((pred, predIdx) => (
                              <div key={predIdx} className="text-gray-600 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                {pred.name} {pred.type} {pred.value}
                              </div>
                            ))}
                          </div>
                        )}
                        {cred.nonRevoked && (
                          <div className="text-xs space-y-1 ml-2 mt-2">
                            <p className="font-semibold text-gray-700 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                              Non-Revoked
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ) : null
      }
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
      draggableId={`scenario-screen-${scenarioId}-${idx}`}
      disableDragStart={!canEdit || isPredefinedScreen}
      deleteTitle="Delete connection screens"
      hoverIdPrefix={scenarioId}
      showAddButton={canEdit}
    />
  )
}
