import type { Showcase, IntroductionStep, ProgressBarStep } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { publicBaseUrl, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { saveScreenToShowcase } from '../../../utils/saveScreenToShowcase'
import { IntroductionInitializedModal } from '../../IntroductionInitializedModal'
import { ScreenContentCard } from '../../ScreenContentCard'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'

interface IntroductionTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
}

export function IntroductionTab({ showcase, isNewShowcase, onTabChange, onRefresh }: IntroductionTabProps) {
  const auth = useAuth()
  const [editingScreenIdx, setEditingScreenIdx] = useState<number | null>(null)
  const [editingScreen, setEditingScreen] = useState<IntroductionStep | null>(null)
  const [editingProgressBar, setEditingProgressBar] = useState<ProgressBarStep | null>(null)
  const [insertionIdx, setInsertionIdx] = useState<number | null>(null)
  const [reorderedIntroduction, setReorderedIntroduction] = useState<IntroductionStep[] | null>(null)
  const [showIntroductionModal, setShowIntroductionModal] = useState<boolean>(isNewShowcase ?? false)
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  const handleEditClick = (idx: number, screen: IntroductionStep) => {
    const progressStep = showcase.progressBar?.find((p) => p.introductionStep === screen.screenId)
    setEditingScreenIdx(idx)
    setEditingScreen(screen)
    setEditingProgressBar(progressStep || null)
  }

  const handleAddScreenClick = (afterIdx: number) => {
    // Create a new empty screen template
    const newScreen: IntroductionStep = {
      screenId: '',
      name: '',
      text: '',
    }
    setInsertionIdx(afterIdx + 1) // Insert after the hovered position
    setEditingScreenIdx(-1) // Indicator for new screen
    setEditingScreen(newScreen)
    setEditingProgressBar(null)
  }

  const handleSaveScreen = async (updatedScreen: IntroductionStep, updatedProgressBar?: ProgressBarStep) => {
    if (!showcase || !auth.user?.access_token) return

    try {
      const currentOnboarding = reorderedIntroduction || showcase.introduction || []

      const { updatedItems } = await saveScreenToShowcase({
        showcase,
        auth,
        updatedScreen,
        editingScreenIdx,
        insertionIdx,
        screenType: 'introduction',
        onRefresh,
        currentItems: currentOnboarding,
      })

      // If progressBar was updated, save it to the character
      if (updatedProgressBar) {
        const updatedProgressBars = showcase.progressBar?.map((pb) =>
          pb.introductionStep === updatedProgressBar.introductionStep
            ? {
                ...pb,
                iconLight: updatedProgressBar.iconLight,
                iconDark: updatedProgressBar.iconDark,
              }
            : pb,
        ) || [updatedProgressBar]

        await updateShowcase(auth, showcase.name, {
          progressBar: updatedProgressBars,
        })

        onRefresh?.()
      }

      // Update local state
      setReorderedIntroduction(updatedItems as IntroductionStep[])

      setEditingScreenIdx(null)
      setEditingScreen(null)
      setEditingProgressBar(null)
      setInsertionIdx(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving screen:', error)
    }
  }

  const handleDrop = async (dropIdx: number) => {
    if (draggedIdx === null || !showcase.introduction) return

    const newIntroduction = [...(reorderedIntroduction || showcase.introduction)]
    const [draggedItem] = newIntroduction.splice(draggedIdx, 1)
    newIntroduction.splice(dropIdx, 0, draggedItem)

    try {
      // Call API to persist reordered introduction
      await updateShowcase(auth, showcase.name, { introduction: newIntroduction })

      // Refresh component with backend results
      await onRefresh?.()

      // Clear local reordering state to use fresh data from backend
      setReorderedIntroduction(null)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error reordering introduction screens:', error)
    }

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
        {(reorderedIntroduction || showcase.introduction)?.map((screen, idx) => {
          const progressStep = showcase.progressBar?.find((p) => p.introductionStep === screen.screenId)
          return (
            <div key={idx}>
              <div className="flex gap-6 items-center">
                {/* Progress Icon */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  {progressStep ? (
                    <>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-bcgov-blue bg-blue-50">
                        <img
                          src={`${publicBaseUrl}${progressStep.iconLight}`}
                          alt={progressStep.name}
                          className="w-6 h-6"
                        />
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
                  title={screen.name}
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
              {idx !== ((reorderedIntroduction || showcase.introduction)?.length ?? 0) - 1 && (
                <div
                  className="relative h-6 flex items-center justify-center mt-1"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <button
                    onClick={() => handleAddScreenClick(idx)}
                    className={`w-7 h-7 rounded-full bg-bcgov-blue text-white flex items-center justify-center hover:bg-bcgov-blue-dark transition-all duration-200 shadow-md ${
                      hoverIdx === idx
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
        progressBarStep={editingProgressBar}
        showcase={showcase}
        isCreate={editingScreenIdx === -1}
        screenType="introduction"
        onSave={handleSaveScreen}
      />
      <IntroductionInitializedModal
        isOpen={showIntroductionModal}
        onClose={() => setShowIntroductionModal(false)}
        showcaseName={showcase.name}
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
