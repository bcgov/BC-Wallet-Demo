import type { ScenarioScreen, Showcase } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, publicBaseUrl, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { saveScreenToShowcase } from '../../../utils/saveScreenToShowcase'
import { ScreenContentCard } from '../../ScreenContentCard'
import { AddConnectionButton } from '../buttons/AddConnectionButton'
import { DeleteScreenPairButton } from '../buttons/DeleteScreenPairButton'
import { CreateConnectionAndProofScreensModal } from '../modals/CreateConnectionAndProofScreensModal'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { CreateScenarioModal } from '../modals/CreateScenarioModal'
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal'

interface ScenariosTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
}

export function ScenariosTab({ showcase, isNewShowcase, onRefresh }: ScenariosTabProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<ScenarioScreen | null>(null)
  const [insertionIdx, setInsertionIdx] = useState<number | null>(null)
  const [reorderedScreens, setReorderedScreens] = useState<Record<string, ScenarioScreen[]>>({})
  const [isCreateScenarioModalOpen, setIsCreateScenarioModalOpen] = useState(false)
  const [isCreateConnectionProofModalOpen, setIsCreateConnectionProofModalOpen] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<string | null>(null)
  const [lineHeight, setLineHeight] = useState<string>('auto')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  useEffect(() => {
    // Only set initial scenario if not already set
    if (showcase.scenarios?.length && !activeScenario) {
      setActiveScenario(showcase.scenarios[0].id)
    }
  }, [showcase.scenarios?.length])

  useEffect(() => {
    const calculateLineHeight = () => {
      if (containerRef.current) {
        // Find circles using data attributes for robustness
        const firstCircle = containerRef.current.querySelector('[data-first-circle]')
        const lastCircle = containerRef.current.querySelector('[data-last-circle]')

        if (firstCircle && lastCircle) {
          const container = containerRef.current
          const containerRect = container.getBoundingClientRect()
          const firstRect = firstCircle.getBoundingClientRect()
          const lastRect = lastCircle.getBoundingClientRect()

          // Calculate positions relative to container
          const topOffset = firstRect.top - containerRect.top + firstRect.height / 2
          const bottomOffset = containerRect.bottom - lastRect.bottom + lastRect.height / 2

          setLineHeight(`calc(100% - ${topOffset}px - ${bottomOffset}px)`)
        }
      }
    }

    calculateLineHeight()

    // Listen for window resize
    window.addEventListener('resize', calculateLineHeight)

    // Create ResizeObserver to watch container changes
    const resizeObserver = new ResizeObserver(calculateLineHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', calculateLineHeight)
      resizeObserver.disconnect()
    }
  }, [activeScenario, reorderedScreens])

  const isEditingPredefinedScreen =
    editingScreen?.screenId === 'START' ||
    editingScreen?.screenId === 'CONNECTION' ||
    editingScreen?.screenId === 'PROOF' ||
    editingScreen?.screenId === 'STEP_END'

  const handleEditClick = (idx: number, screen: ScenarioScreen) => {
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
  }

  const handleAddScreenClick = (afterIdx: number) => {
    // Create a new empty screen template
    const newScreen: ScenarioScreen = {
      screenId: '',
      name: '',
      text: '',
    }
    setInsertionIdx(afterIdx + 1) // Insert after the hovered position
    setEditingScreenIdx(-1) // Indicator for new screen
    setEditingScreen(newScreen)
  }

  const handleSaveScreen = async (updatedScreen: ScenarioScreen) => {
    if (!showcase || !activeScenario || !auth.user?.access_token) return

    try {
      const activeScreen = showcase.scenarios?.find((sc) => sc.id === activeScenario)
      if (!activeScreen) return

      const currentScreens = reorderedScreens[activeScenario] || activeScreen.screens || []

      const { updatedItems } = await saveScreenToShowcase({
        showcase,
        auth,
        updatedScreen,
        editingScreenIdx,
        insertionIdx,
        screenType: 'scenarios',
        activeScenarioId: activeScenario,
        onRefresh,
        currentItems: currentScreens,
      })

      // Update local state
      setReorderedScreens({ ...reorderedScreens, [activeScenario]: updatedItems as ScenarioScreen[] })

      setEditingScreenIdx(null)
      setEditingScreen(null)
      setInsertionIdx(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving screen:', error)
    }
  }

  const handleDrop = async (dropIdx: number) => {
    if (draggedIdx === null || !activeScenario || !showcase.scenarios) return

    const activeUC = showcase.scenarios.find((sc) => sc.id === activeScenario)
    if (!activeUC?.screens) return

    const currentScreens = reorderedScreens[activeScenario] || activeUC.screens
    const newScreens = [...currentScreens]
    const [draggedItem] = newScreens.splice(draggedIdx, 1)
    newScreens.splice(dropIdx, 0, draggedItem)

    try {
      // Update the scenarios array with the reordered screens for this scenario
      const updatedScenarios = showcase.scenarios.map((sc) =>
        sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
      )

      // Call API to persist reordered screens
      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })

      // Refresh component with backend results
      await onRefresh?.()

      // Clear local reordering state to use fresh data from backend
      setReorderedScreens({})
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reordering scenario screens:', error)
    }

    setDraggedIdx(null)
    setDragOverIdx(null)
  }

  const handleFinish = async () => {
    try {
      await updateShowcase(auth, showcase.name, { status: 'active' })
      navigate(`${adminBaseRoute}/creator`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating showcase status:', error)
    }
  }

  const handleShowDeleteConfirm = (connectionIdx: number) => {
    setDeleteConfirmIdx(connectionIdx)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConnectionProofPair = async (connectionIdx: number) => {
    if (!activeScenario || !showcase.scenarios) return

    const activeScenario_data = showcase.scenarios.find((sc) => sc.id === activeScenario)
    if (!activeScenario_data?.screens) return

    const currentScreens = reorderedScreens[activeScenario] || activeScenario_data.screens
    const newScreens = currentScreens.filter((_, idx) => !(idx === connectionIdx || idx === connectionIdx + 1))

    try {
      const updatedScenarios = showcase.scenarios.map((sc) =>
        sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
      )

      await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
      await onRefresh?.()
      setReorderedScreens({})
      setShowDeleteConfirm(false)
      setDeleteConfirmIdx(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting CONNECTION/PROOF pair:', error)
    }
  }

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Scenarios Tab */}
      <div className="w-4/5 mb-8 px-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-bcgov-black">Scenarios</h2>
          <h5 className="text-gray-500 mt-2">Create scenarios to walk users through credential usage.</h5>
        </div>
        <button
          onClick={() => setIsCreateScenarioModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-bcgov-blue text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Scenario
        </button>
      </div>
      {/* Inner Tabs for Use Cases */}
      <div className="w-4/5 px-6 mb-6">
        <div className="flex gap-4 border-b border-gray-200">
          {showcase.scenarios?.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => setActiveScenario(scenario.id)}
              className={`py-2 px-3 font-medium transition-colors border-b-2 ${
                activeScenario === scenario.id
                  ? 'border-bcgov-blue-light text-bcgov-blue-light'
                  : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
              }`}
            >
              {scenario.name}
            </button>
          ))}
        </div>
      </div>
      {/* Scenario Content */}
      <div className="w-4/5 px-6">
        {showcase?.scenarios?.map((scenario) => {
          const currentScreens = reorderedScreens[scenario.id] || scenario.screens || []
          return activeScenario === scenario.id ? (
            <div key={scenario.id} className="bg-white rounded-lg p-4 relative" ref={containerRef}>
              {/* Vertical connecting line */}
              <div className="absolute left-10 top-8 bg-bcgov-blue z-0" style={{ height: lineHeight, width: '1px' }} />
              {/* Section Header */}
              <div className="mt-4 mb-6 flex gap-6 items-center">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
                  data-first-circle
                >
                  1
                </div>
                <h3 className="text-lg font-semibold text-bcgov-black">Description</h3>
              </div>

              {currentScreens.map((screen, idx) => {
                // Skip PROOF screens as they're rendered within CONNECTION blocks
                const prevScreen = idx > 0 ? currentScreens[idx - 1] : null
                if (screen.screenId === 'PROOF' && prevScreen?.screenId === 'CONNECTION') {
                  return null
                }

                // Check if this CONNECTION screen has a PROOF child
                const nextScreen = idx + 1 < currentScreens.length ? currentScreens[idx + 1] : null
                const hasProofChild = screen.screenId === 'CONNECTION' && nextScreen?.screenId === 'PROOF'

                // Check if screen is a predefined system screen (not draggable)
                const isPredefinedScreen =
                  screen.screenId === 'START' ||
                  screen.screenId === 'CONNECTION' ||
                  screen.screenId === 'PROOF' ||
                  screen.screenId === 'STEP_END'

                const handleScreenDragStart = (idx: number) => {
                  if (isPredefinedScreen) return
                  handleDragStart(idx)
                }

                return (
                  <div key={idx}>
                    {/* Section header for CONNECTION screen */}
                    {screen.screenId === 'CONNECTION' && (
                      <div className="mt-4 mb-6 flex gap-6 items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
                          2
                        </div>
                        <h3 className="text-lg font-semibold text-bcgov-black">
                          Verify - Connection and Proof Screens
                        </h3>
                      </div>
                    )}

                    {/* Show "2" header if no CONNECTION screens exist and we're at STEP_END */}
                    {screen.screenId === 'STEP_END' && !currentScreens.some((s) => s.screenId === 'CONNECTION') && (
                      <>
                        <div className="mt-4 mb-6 flex gap-6 items-center">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10">
                            2
                          </div>
                          <h3 className="text-lg font-semibold text-bcgov-black">
                            Verify - Connection and Proof Screens
                          </h3>
                        </div>
                        <div className="mb-6">
                          <AddConnectionButton
                            onClick={() => setIsCreateConnectionProofModalOpen(true)}
                            label="Add Connection and Proof Screens"
                          />
                        </div>
                      </>
                    )}

                    {/* Section header for STEP_END screen */}
                    {screen.screenId === 'STEP_END' && (
                      <div className="mt-4 mb-6 flex gap-6 items-center">
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full bg-bcgov-blue text-white flex items-center justify-center text-xs font-semibold ml-2 relative z-10"
                          data-last-circle
                        >
                          3
                        </div>
                        <h3 className="text-lg font-semibold text-bcgov-black">Success</h3>
                      </div>
                    )}

                    <div className="mt-2">
                      <div className="flex gap-6 items-center">
                        {/* Placeholder for icon alignment - keeping empty for consistency */}
                        <div className="flex-shrink-0 w-12" />

                        {/* Outer container for CONNECTION-PROOF pair */}
                        <div
                          className={`flex-1 ${hasProofChild ? 'border border-gray-200 rounded-lg p-4 bg-gray-50 relative' : ''}`}
                        >
                          {/* Delete button for CONNECTION-PROOF pair */}
                          <DeleteScreenPairButton
                            isVisible={hasProofChild}
                            onDelete={handleShowDeleteConfirm}
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
                          {/* CONNECTION Screen Content */}
                          <div className="flex gap-6 items-center">
                            <div className="flex-1">
                              <ScreenContentCard
                                draggableId={`scenario-screen-${scenario.id}-${idx}`}
                                screenId={screen.screenId}
                                title={screen.name}
                                text={screen.text}
                                image={screen.image}
                                onEdit={() => handleEditClick(idx, screen)}
                                isDragging={draggedIdx === idx}
                                isDragOver={dragOverIdx === idx}
                                disableDrag={isPredefinedScreen}
                                onDragStart={() => handleScreenDragStart(idx)}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={() => handleDrop(idx)}
                                containerClassName={`border border-gray-300 rounded-lg ${hasProofChild ? 'bg-gray-100' : 'bg-gray-50'} p-8 relative flex items-center justify-between gap-6`}
                                textMarginClass=""
                              />
                            </div>
                          </div>

                          {/* Render PROOF child screen if it exists */}
                          {hasProofChild && (
                            <div className="mt-4">
                              <div className="flex gap-6 items-center">
                                <div className="flex-1">
                                  <ScreenContentCard
                                    draggableId={`scenario-screen-${scenario.id}-${idx + 1}`}
                                    screenId={nextScreen!.screenId}
                                    title={nextScreen!.name}
                                    text={nextScreen!.text}
                                    image={nextScreen!.image}
                                    onEdit={() => handleEditClick(idx + 1, nextScreen!)}
                                    isDragging={draggedIdx === idx + 1}
                                    isDragOver={dragOverIdx === idx + 1}
                                    disableDrag={true}
                                    onDragStart={() => handleScreenDragStart(idx + 1)}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(idx + 1)}
                                    containerClassName="border border-gray-300 rounded-lg bg-gray-100 p-8 relative flex items-center justify-between gap-6"
                                    textMarginClass=""
                                  />
                                </div>
                              </div>
                              {/* Display requestOptions under PROOF screen */}
                              {nextScreen?.requestOptions && (
                                <div className="mt-4 pt-4 border-t border-gray-300">
                                  <p className="text-xs font-semibold text-bcgov-black mb-3">Proof Requests</p>
                                  <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold text-bcgov-black mb-2">
                                      {nextScreen.requestOptions.name}
                                    </h4>
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
                                                <span className="text-sm font-medium text-bcgov-black">
                                                  {cred.name}
                                                </span>
                                              </div>
                                              {cred.schema_id && (
                                                <p className="text-xs text-gray-500 mb-2 font-mono break-all">
                                                  {cred.schema_id}
                                                </p>
                                              )}
                                              {cred.properties && cred.properties.length > 0 && (
                                                <div className="text-xs space-y-1 ml-2">
                                                  <p className="font-semibold text-gray-700">Properties:</p>
                                                  {cred.properties.map((prop, propIdx) => (
                                                    <div
                                                      key={propIdx}
                                                      className="text-gray-600 flex items-center gap-2"
                                                    >
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
                                                    <div
                                                      key={predIdx}
                                                      className="text-gray-600 flex items-center gap-2"
                                                    >
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

                      {/* Hover area to add new screen below (not after last screen, and not after CONNECTION if it has PROOF child) */}
                      {idx !== currentScreens.length - 1 &&
                        !(hasProofChild && idx + 1 === currentScreens.length - 1) && (
                          <div
                            className="flex gap-6 items-center mt-2"
                            onMouseEnter={() => setHoverIdx(`${scenario.id}-${idx}`)}
                            onMouseLeave={() => setHoverIdx(null)}
                          >
                            <div className="flex-shrink-0 w-12" />
                            <button
                              onClick={() => handleAddScreenClick(idx + (hasProofChild ? 1 : 0))}
                              className={`flex-1 py-3 border-2 border-dashed border-gray-200 rounded-lg bg-transparent flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-bcgov-blue transition-all duration-200 ${
                                hoverIdx === `${scenario.id}-${idx}`
                                  ? 'opacity-100 pointer-events-auto'
                                  : 'opacity-0 pointer-events-none'
                              }`}
                              title="Add screen"
                            >
                              <PlusIcon className="w-5 h-5 text-gray-400" />
                              <span className="text-sm text-gray-500">Add screen</span>
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null
        })}
      </div>
      <CreateOrEditScreenModal
        isOpen={editingScreenIdx !== null}
        onClose={() => {
          setEditingScreenIdx(null)
          setEditingScreen(null)
        }}
        screen={editingScreen as any}
        progressBarStep={null}
        isCreate={editingScreenIdx === -1}
        screenType="scenarios"
        showcaseName={showcase.name}
        auth={auth}
        disableScreenId={isEditingPredefinedScreen && editingScreenIdx !== -1}
        disableDelete={isEditingPredefinedScreen && editingScreenIdx !== -1}
        onSave={(updatedScreen) => handleSaveScreen(updatedScreen as ScenarioScreen)}
        onDelete={async () => {
          // Handle deletion from showcase for scenario screens
          if (editingScreenIdx !== null && editingScreenIdx !== -1 && activeScenario && showcase.scenarios) {
            const activeScenarioData = showcase.scenarios.find((sc) => sc.id === activeScenario)
            if (activeScenarioData) {
              const currentScreens = reorderedScreens[activeScenario] || activeScenarioData.screens || []
              const newScreens = currentScreens.filter((_, idx) => idx !== editingScreenIdx)

              try {
                const updatedScenarios = showcase.scenarios.map((sc) =>
                  sc.id === activeScenario ? { ...sc, screens: newScreens } : sc,
                )
                await updateShowcase(auth, showcase.name, { scenarios: updatedScenarios })
                // Clear local reordering state to fetch fresh data from backend
                setReorderedScreens({})
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Error deleting screen:', error)
              }
            }
          }

          // Refresh after deletion
          await onRefresh?.()
          // Clear editing state
          setEditingScreenIdx(null)
          setEditingScreen(null)
        }}
      />
      <CreateScenarioModal
        isOpen={isCreateScenarioModalOpen}
        onClose={() => setIsCreateScenarioModalOpen(false)}
        showcase={showcase}
        auth={auth}
        onRefresh={onRefresh}
        onScenarioCreated={(scenarioId) => {
          setIsCreateScenarioModalOpen(false)
          setActiveScenario(scenarioId)
        }}
      />
      <CreateConnectionAndProofScreensModal
        isOpen={isCreateConnectionProofModalOpen}
        onClose={() => setIsCreateConnectionProofModalOpen(false)}
        showcase={showcase}
        scenarioId={activeScenario}
        onComplete={onRefresh}
      />
      {isNewShowcase && (
        <div className="w-4/5 mt-8 px-6 flex justify-center">
          <button
            onClick={handleFinish}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Finish
          </button>
        </div>
      )}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Connection and Proof Screens?"
        description="Are you sure you want to delete these connection and proof request screens? This action cannot be undone."
        onCancel={() => {
          setShowDeleteConfirm(false)
          setDeleteConfirmIdx(null)
        }}
        onConfirm={() => {
          if (deleteConfirmIdx !== null) {
            handleDeleteConnectionProofPair(deleteConfirmIdx)
          }
        }}
        showIcon={true}
      />{' '}
    </div>
  )
}
