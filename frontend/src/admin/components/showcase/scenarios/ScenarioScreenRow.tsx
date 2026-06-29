import type { ScenarioScreen, Credential, CredentialRequest } from '../../../types'

import { Cog6ToothIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, getAllCredentials, updateShowcase, getShowcaseByName } from '../../../api/adminApi'
import { useHasRole } from '../../../hooks/useUserRole'
import { formatCustomDateStampValue } from '../../../utils/formatters'
import logger from '../../../utils/logger'
import { ScreenRowBase } from '../ScreenRowBase'
import { SelectingAttributesStep } from '../modals/steps/SelectingAttributesStep'

interface ScenarioScreenRowProps {
  screen: ScenarioScreen
  nextScreen?: ScenarioScreen
  idx: number
  scenarioId: string
  showcaseName: string
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
  onRefreshShowcase?: () => void | Promise<void>
}

export function ScenarioScreenRow({
  screen,
  nextScreen,
  idx,
  scenarioId,
  showcaseName,
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
  onRefreshShowcase,
}: ScenarioScreenRowProps) {
  const auth = useAuth()
  const canEdit = useHasRole('creator')
  const [editingCredIdx, setEditingCredIdx] = useState<number | null>(null)
  const [selectedAttributes, setSelectedAttributes] = useState<Map<string, any>>(new Map())
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)

  useEffect(() => {
    const fetchCredential = async () => {
      if (editingCredIdx !== null && nextScreen?.requestOptions?.requestedCredentials?.[editingCredIdx]) {
        const proofRequest = nextScreen.requestOptions.requestedCredentials[editingCredIdx]
        try {
          const credentials = await getAllCredentials(auth)
          const cred = credentials.find((c) => c.name === proofRequest.name)
          setEditingCredential(cred || null)

          // Build and set initial attributes when modal opens
          const initialRequest = proofRequest
          const attributeMap = new Map<string, any>()

          if (initialRequest?.properties) {
            initialRequest.properties.forEach((prop: string) => {
              attributeMap.set(prop, { property: true })
            })
          }

          if (initialRequest?.predicates) {
            initialRequest.predicates.forEach((pred: any) => {
              const existing = attributeMap.get(pred.name) || {}
              attributeMap.set(pred.name, {
                ...existing,
                predicate: true,
                predicateType: pred.type,
                predicateValue: pred.value,
              })
            })
          }

          if (initialRequest?.nonRevoked && cred?.attributes) {
            cred.attributes.forEach((attr: any) => {
              const existing = attributeMap.get(attr.name) || {}
              attributeMap.set(attr.name, { ...existing, nonRevoked: true })
            })
          }

          setSelectedAttributes(attributeMap)
        } catch (error) {
          logger.error('Error fetching credential:', error)
          setEditingCredential(null)
          setSelectedAttributes(new Map())
        }
      }
    }
    fetchCredential()
  }, [editingCredIdx, auth.isAuthenticated, nextScreen])

  return (
    <>
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
                        <div key={credIdx} className="bg-white rounded p-3 flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {cred.icon && (
                                <img
                                  src={`${publicBaseUrl}${cred.icon}`}
                                  alt={cred.name}
                                  className="w-8 h-8 object-contain"
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
                                {cred.predicates.map((pred, predIdx) => {
                                  const displayValue = formatCustomDateStampValue(pred.value, 'presentation')
                                  return (
                                    <div key={predIdx} className="text-gray-600 flex items-center gap-2">
                                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                      {pred.name} {pred.type} {displayValue}
                                    </div>
                                  )
                                })}
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
                          {canEdit && (
                            <button
                              onClick={() => setEditingCredIdx(credIdx)}
                              className="flex-shrink-0 p-2 text-gray-600 hover:text-bcgov-blue hover:bg-blue-50 rounded transition-colors"
                              title="Edit proof request"
                              aria-label={`Edit proof request for ${cred.name}`}
                            >
                              <Cog6ToothIcon className="w-5 h-5" />
                            </button>
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

      {/* Edit Proof Request Modal */}
      {editingCredIdx !== null && nextScreen?.requestOptions?.requestedCredentials?.[editingCredIdx] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <SelectingAttributesStep
                currentCredential={editingCredential}
                selectedAttributes={selectedAttributes}
                currentIndex={0}
                totalCredentials={1}
                initialRequest={nextScreen.requestOptions?.requestedCredentials?.[editingCredIdx]}
                onUpdateAttribute={(attrName, request) => {
                  const updated = new Map(selectedAttributes)
                  updated.set(attrName, request)
                  setSelectedAttributes(updated)
                }}
                onRemoveAttribute={(attrName) => {
                  const updated = new Map(selectedAttributes)
                  updated.delete(attrName)
                  setSelectedAttributes(updated)
                }}
                onPrevious={() => {}}
                onNext={() => {}}
                onContinue={async () => {
                  try {
                    // Convert selectedAttributes Map back to proof request format
                    const properties: string[] = []
                    const predicates: any[] = []
                    let nonRevoked = false

                    selectedAttributes.forEach((request, attrName) => {
                      if (request.property) {
                        properties.push(attrName)
                      }
                      if (request.predicate) {
                        predicates.push({
                          name: attrName,
                          type: request.predicateType,
                          value: request.predicateValue,
                        })
                      }
                      if (request.nonRevoked) {
                        nonRevoked = true
                      }
                    })

                    // Fetch the current showcase
                    const currentShowcase = await getShowcaseByName(auth, showcaseName)

                    // Find and update the proof request in the scenarios
                    const updatedScenarios = currentShowcase.scenarios.map((scenario) => {
                      if (scenario.id === scenarioId) {
                        return {
                          ...scenario,
                          screens: scenario.screens.map((scenarioScreen) => {
                            if (scenarioScreen.screenId === nextScreen?.screenId && scenarioScreen.requestOptions) {
                              const updatedCredentials = scenarioScreen.requestOptions.requestedCredentials.map(
                                (cred, credIdx) => {
                                  if (credIdx === editingCredIdx) {
                                    const updated: CredentialRequest = {
                                      ...cred,
                                      properties: properties.length > 0 ? properties : undefined,
                                      predicates: predicates.length > 0 ? predicates : undefined,
                                      nonRevoked: nonRevoked ? { to: '$now' as const } : undefined,
                                    }
                                    return updated
                                  }
                                  return cred
                                },
                              )
                              return {
                                ...scenarioScreen,
                                requestOptions: {
                                  ...scenarioScreen.requestOptions,
                                  requestedCredentials: updatedCredentials,
                                },
                              }
                            }
                            return scenarioScreen
                          }),
                        }
                      }
                      return scenario
                    })

                    // Update the showcase with the modified scenarios
                    await updateShowcase(auth, showcaseName, {
                      scenarios: updatedScenarios,
                    })

                    logger.info('Proof request updated successfully')

                    // Refresh the showcase state in parent component
                    if (onRefreshShowcase) {
                      await onRefreshShowcase()
                    }
                  } catch (error) {
                    logger.error('Error updating showcase:', error)
                  }

                  setEditingCredIdx(null)
                  setSelectedAttributes(new Map())
                  setEditingCredential(null)
                }}
                onClose={() => {
                  setEditingCredIdx(null)
                  setSelectedAttributes(new Map())
                  setEditingCredential(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
