import type { ScenarioScreen, Showcase } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { saveScreenToShowcase } from '../../../utils/saveScreenToShowcase'
import { ScreenContentCard } from '../../ScreenContentCard'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { CreateScenarioModal } from '../modals/CreateScenarioModal'

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
  const [hoverIdx, setHoverIdx] = useState<string | null>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  useEffect(() => {
    // Only set initial scenario if not already set
    if (showcase.scenarios?.length && !activeScenario) {
      setActiveScenario(showcase.scenarios[0].id)
    }
  }, [showcase.scenarios?.length])

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

  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Scenarios Tab */}
      <div className="w-full max-w-6xl mb-8 px-6 flex items-center justify-between">
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
      <div className="w-full max-w-6xl px-6 mb-6">
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
      <div className="w-full max-w-6xl px-6 space-y-2">
        {showcase?.scenarios?.map((scenario) => {
          const currentScreens = reorderedScreens[scenario.id] || scenario.screens || []
          return activeScenario === scenario.id ? (
            <div key={scenario.id}>
              {currentScreens.map((screen, idx) => (
                <div key={idx}>
                  <ScreenContentCard
                    draggableId={`scenario-screen-${scenario.id}-${idx}`}
                    screenId={screen.screenId}
                    title={screen.name}
                    text={screen.text}
                    image={screen.image}
                    requestOptions={screen.requestOptions}
                    onEdit={() => handleEditClick(idx, screen)}
                    isDragging={draggedIdx === idx}
                    isDragOver={dragOverIdx === idx}
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(idx)}
                    containerClassName="border border-gray-300 rounded-lg bg-white p-8 relative flex items-center justify-between gap-6"
                    textMarginClass=""
                  />

                  {/* Hover area to add new screen below (not after last screen) */}
                  {idx !== currentScreens.length - 1 && (
                    <div
                      className="relative h-8 flex items-center justify-center mt-1 mb-1"
                      onMouseEnter={() => setHoverIdx(`${scenario.id}-${idx}`)}
                      onMouseLeave={() => setHoverIdx(null)}
                    >
                      <button
                        onClick={() => handleAddScreenClick(idx)}
                        className={`w-7 h-7 rounded-full bg-bcgov-blue text-white flex items-center justify-center hover:bg-bcgov-blue-dark transition-all duration-200 shadow-md ${
                          hoverIdx === `${scenario.id}-${idx}`
                            ? 'opacity-100 scale-100 pointer-events-auto'
                            : 'opacity-0 scale-95 pointer-events-none'
                        }`}
                        title="Add screen"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
        showcase={showcase}
        isCreate={editingScreenIdx === -1}
        screenType="scenarios"
        onSave={(updatedScreen) => handleSaveScreen(updatedScreen as ScenarioScreen)}
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

      {isNewShowcase && (
        <div className="w-full max-w-6xl mt-8 px-6 flex justify-center">
          <button
            onClick={() => navigate(`${adminBaseRoute}/creator`)}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  )
}
