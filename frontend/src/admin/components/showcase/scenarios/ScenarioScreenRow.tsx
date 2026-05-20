import type { ScenarioScreen } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'

import { publicBaseUrl } from '../../../api/adminApi'
import { ScreenContentCard } from '../../ScreenContentCard'
import { DeleteScreenPairButton } from '../buttons/DeleteScreenPairButton'

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
  hoverIdx: string | null
  setHoverIdx: (idx: string | null) => void
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
  const handleScreenDragStart = () => {
    if (isPredefinedScreen) return
    onDragStart(idx)
  }

  return (
    <div className="mt-2">
      <div className="flex gap-6 items-center">
        {/* Placeholder for icon alignment */}
        <div className="flex-shrink-0 w-12" />

        {/* Outer container for CONNECTION-PROOF pair */}
        <div className={`flex-1 ${hasProofChild ? 'border border-gray-200 rounded-lg p-4 bg-gray-50 relative' : ''}`}>
          {/* Delete button for CONNECTION-PROOF pair */}
          <DeleteScreenPairButton
            isVisible={hasProofChild}
            onDelete={onShowDeleteConfirm}
            index={idx}
            title="Delete connection screens"
            className="z-10"
          />

          {/* Verifier Label for CONNECTION screens */}
          {screen.screenId === 'CONNECTION' && (screen as any).verifier?.name && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-bcgov-black">{(screen as any).verifier.name}</p>
            </div>
          )}

          {/* Screen Content */}
          <div className="flex gap-6 items-center">
            <div className="flex-1">
              <ScreenContentCard
                draggableId={`scenario-screen-${scenarioId}-${idx}`}
                screenId={screen.screenId}
                title={screen.name}
                text={screen.text}
                image={screen.image}
                onEdit={() => onEditClick(idx, screen)}
                isDragging={draggedIdx === idx}
                isDragOver={dragOverIdx === idx}
                disableDrag={isPredefinedScreen}
                onDragStart={handleScreenDragStart}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={() => onDrop(idx)}
                containerClassName={`border border-gray-300 rounded-lg ${hasProofChild ? 'bg-gray-100' : 'bg-gray-50'} p-8 relative flex items-center justify-between gap-6`}
                textMarginClass=""
              />
            </div>
          </div>

          {/* Render PROOF child screen if it exists */}
          {hasProofChild && nextScreen && (
            <div className="mt-4">
              <div className="flex gap-6 items-center">
                <div className="flex-1">
                  <ScreenContentCard
                    draggableId={`scenario-screen-${scenarioId}-${idx + 1}`}
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
                    containerClassName="border border-gray-300 rounded-lg bg-gray-100 p-8 relative flex items-center justify-between gap-6"
                    textMarginClass=""
                  />
                </div>
              </div>

              {/* Display requestOptions under PROOF screen */}
              {nextScreen.requestOptions && (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover area to add new screen below */}
      {idx !== screensLength - 1 && !(hasProofChild && idx + 1 === screensLength - 1) && (
        <div
          className="flex gap-6 items-center mt-2"
          onMouseEnter={() => setHoverIdx(`${scenarioId}-${idx}`)}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <div className="flex-shrink-0 w-12" />
          <button
            onClick={() => onAddScreenClick(idx + (hasProofChild ? 1 : 0))}
            className={`flex-1 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-transparent flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-bcgov-blue transition-all duration-200 ${
              hoverIdx === `${scenarioId}-${idx}` ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
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
