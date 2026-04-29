import type { CustomCharacter, UseCaseScreen } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { baseRoute } from '../../../../client/api/BaseUrl'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { ScreenContentCard } from '../../ScreenContentCard'

import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { CreateScenarioModal } from '../modals/CreateScenarioModal'

interface ScenariosTabProps {
  character: CustomCharacter | null
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void
}

export function ScenariosTab({ character, isNewShowcase, onRefresh }: ScenariosTabProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<UseCaseScreen | null>(null)
  const [reorderedScreens, setReorderedScreens] = useState<Record<string, UseCaseScreen[]>>({})
  const [isCreateScenarioModalOpen, setIsCreateScenarioModalOpen] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<string | null>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  useEffect(() => {
    // Only set initial scenario if not already set
    if (character?.useCases?.length && !activeScenario) {
      setActiveScenario(character.useCases[0].id)
    }
  }, [character?.useCases?.length])

  const handleEditClick = (idx: number, screen: UseCaseScreen) => {
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
  }

  const handleAddScreenClick = () => {
    // Create a new empty screen template
    const newScreen: UseCaseScreen = {
      screenId: '',
      title: '',
      text: '',
    }
    setEditingScreenIdx(-1) // Indicator for new screen
    setEditingScreen(newScreen)
  }

  const handleSaveScreen = (updatedScreen: UseCaseScreen) => {
    if (!character || editingScreenIdx === null) return

    // TODO: Call API to save changes to the character
    // eslint-disable-next-line no-console
    console.log('Saving updated screen:', updatedScreen)

    setEditingScreenIdx(null)
    setEditingScreen(null)
  }

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null || !activeScenario || !character?.useCases) return

    const activeUC = character.useCases.find((uc) => uc.id === activeScenario)
    if (!activeUC?.screens) return

    const currentScreens = reorderedScreens[activeScenario] || activeUC.screens
    const newScreens = [...currentScreens]
    const [draggedItem] = newScreens.splice(draggedIdx, 1)
    newScreens.splice(dropIdx, 0, draggedItem)

    // TODO: Call API to persist reordered screens

    // Update local state to reflect the reorder
    setReorderedScreens({ ...reorderedScreens, [activeScenario]: newScreens })

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
          {character?.useCases?.map((useCase) => (
            <button
              key={useCase.id}
              onClick={() => setActiveScenario(useCase.id)}
              className={`py-2 px-3 font-medium transition-colors border-b-2 ${
                activeScenario === useCase.id
                  ? 'border-bcgov-blue-light text-bcgov-blue-light'
                  : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
              }`}
            >
              {useCase.name}
            </button>
          ))}
        </div>
      </div>

      {/* Use Case Content */}
      <div className="w-full max-w-6xl px-6 space-y-2">
        {character?.useCases?.map((useCase) => {
          const currentScreens = reorderedScreens[useCase.id] || useCase.screens || []
          return activeScenario === useCase.id ? (
            <div key={useCase.id}>
              {currentScreens.map((screen, idx) => (
                <div key={idx}>
                  <ScreenContentCard
                    draggableId={`scenario-screen-${useCase.id}-${idx}`}
                    screenId={screen.screenId}
                    title={screen.title}
                    text={screen.text}
                    image={screen.image}
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
                      onMouseEnter={() => setHoverIdx(`${useCase.id}-${idx}`)}
                      onMouseLeave={() => setHoverIdx(null)}
                    >
                      {hoverIdx === `${useCase.id}-${idx}` && (
                        <button
                          onClick={() => handleAddScreenClick()}
                          className="w-7 h-7 rounded-full bg-bcgov-blue text-white flex items-center justify-center hover:bg-bcgov-blue-dark transition-colors shadow-md"
                          title="Add screen"
                        >
                          <PlusIcon className="w-4 h-4" />
                        </button>
                      )}
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
        progressBar={null}
        character={character}
        isCreate={editingScreenIdx === -1}
        onSave={(updatedScreen) => handleSaveScreen(updatedScreen as UseCaseScreen)}
      />

      <CreateScenarioModal
        isOpen={isCreateScenarioModalOpen}
        onClose={() => setIsCreateScenarioModalOpen(false)}
        character={character}
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
            onClick={() => navigate(`${baseRoute}/admin/creator`)}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Finish
          </button>
        </div>
      )}
    </div>
  )
}
