import type { CustomCharacter, OnboardingStep } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import { baseUrl } from '../../../../client/api/BaseUrl'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { OnboardingInitializedModal } from '../../OnboardingInitializedModal'
import { ScreenContentCard } from '../../ScreenContentCard'

import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'

interface ProgressBar {
  name: string
  onboardingStep: string
  iconLight: string
  iconDark: string
}

interface IntroductionTabProps {
  character: CustomCharacter | null
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
}

export function IntroductionTab({ character, isNewShowcase, onTabChange }: IntroductionTabProps) {
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<OnboardingStep | null>(null)
  const [editingProgressBar, setEditingProgressBar] = useState<ProgressBar | null>(null)
  const [reorderedOnboarding, setReorderedOnboarding] = useState<OnboardingStep[] | null>(null)
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(isNewShowcase ?? false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  const handleEditClick = (idx: number, screen: OnboardingStep) => {
    const progressStep = character?.progressBar?.find((p) => p.onboardingStep === screen.screenId)
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
    setEditingProgressBar(progressStep || null)
  }

  const handleAddScreenClick = () => {
    // Create a new empty screen template
    const newScreen: OnboardingStep = {
      screenId: '',
      title: '',
      text: '',
    }
    setEditingScreenIdx(-1) // Indicator for new screen
    setEditingScreen(newScreen)
    setEditingProgressBar(null)
  }

  const handleSaveScreen = () => {
    if (!character) return

    // TODO: Call API to save changes to the character
    // For now, just close the modal

    setEditingScreenIdx(null)
    setEditingScreen(null)
    setEditingProgressBar(null)
  }

  const handleDrop = (dropIdx: number) => {
    if (draggedIdx === null || !character?.onboarding) return

    const newOnboarding = [...(reorderedOnboarding || character.onboarding)]
    const [draggedItem] = newOnboarding.splice(draggedIdx, 1)
    newOnboarding.splice(dropIdx, 0, draggedItem)

    // TODO: Call API to persist reordered onboarding

    // Update local state to reflect the reorder
    setReorderedOnboarding(newOnboarding)

    setDraggedIdx(null)
    setDragOverIdx(null)
  }
  return (
    <div className="flex-1 overflow-auto flex flex-col items-center justify-start py-8">
      {/* Introduction Tab */}
      <div className="w-full max-w-6xl mb-8 px-6">
        <h2 className="text-2xl font-semibold text-bcgov-black">Introduction Screens</h2>
        <h5 className="text-gray-500 mt-2">Configure the introduction screens.</h5>
      </div>
      <div className="w-full max-w-6xl px-6 space-y-2">
        {(reorderedOnboarding || character?.onboarding)?.map((screen, idx) => {
          const progressStep = character?.progressBar?.find((p) => p.onboardingStep === screen.screenId)
          return (
            <div key={idx}>
              <div className="flex gap-6 items-center">
                {/* Progress Icon */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  {progressStep ? (
                    <>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-bcgov-blue bg-blue-50">
                        <img src={`${baseUrl}${progressStep.iconLight}`} alt={progressStep.name} className="w-6 h-6" />
                      </div>
                    </>
                  ) : (
                    <div className="w-12 h-12" />
                  )}
                </div>

                {/* Screen Content */}
                <ScreenContentCard
                  draggableId={`intro-screen-${idx}`}
                  screenId={screen.screenId}
                  title={screen.title}
                  text={screen.text}
                  image={screen.image}
                  credentials={screen.credentials}
                  onEdit={() => handleEditClick(idx, screen)}
                  isDragging={draggedIdx === idx}
                  isDragOver={dragOverIdx === idx}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(idx)}
                />
              </div>

              {/* Hover area to add new screen below (not after last screen) */}
              {idx !== ((reorderedOnboarding || character?.onboarding)?.length ?? 0) - 1 && (
                <div
                  className="relative h-6 flex items-center justify-center mt-1"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  {hoverIdx === idx && (
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
          )
        })}
      </div>

      <CreateOrEditScreenModal
        isOpen={editingScreenIdx !== null}
        onClose={() => {
          setEditingScreenIdx(null)
          setEditingScreen(null)
          setEditingProgressBar(null)
        }}
        screen={editingScreen}
        progressBar={editingProgressBar}
        character={character}
        isCreate={editingScreenIdx === -1}
        onSave={handleSaveScreen}
      />
      <OnboardingInitializedModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        characterName={character?.name}
      />
      {isNewShowcase && (
        <div className="w-full max-w-6xl mt-8 px-6 flex justify-center">
          <button
            onClick={() => onTabChange?.('scenarios')}
            className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
          >
            Next Step
          </button>
        </div>
      )}
    </div>
  )
}
