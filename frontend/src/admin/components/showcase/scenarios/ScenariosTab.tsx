import type { ScenarioScreen, Showcase } from '../../../types'

import { EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { useLineHeight } from '../../../hooks/useLineHeight'
import { useScenarioScreens } from '../../../hooks/useScenarioScreens'
import { useHasRole } from '../../../hooks/useUserRole'
import log from '../../../utils/logger'
import { PreviewPanel } from '../PreviewPanel'
import { PreviewToggleButton } from '../buttons/PreviewToggleButton'
import { CreateConnectionAndProofScreensModal } from '../modals/CreateConnectionAndProofScreensModal'
import { CreateOrEditScreenModal } from '../modals/CreateOrEditScreenModal'
import { CreateScenarioModal } from '../modals/CreateScenarioModal'
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal'

import { ScenarioTimeline } from './ScenarioTimeline'

interface ScenariosTabProps {
  showcase: Showcase
  isNewShowcase?: boolean
  onTabChange?: (tab: string) => void
  onRefresh?: () => void | Promise<void>
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

export function ScenariosTab({ showcase, isNewShowcase, onRefresh, isExpanded, setIsExpanded }: ScenariosTabProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const canEdit = useHasRole('creator')
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [isCreateScenarioModalOpen, setIsCreateScenarioModalOpen] = useState(false)
  const [isCreateConnectionProofModalOpen, setIsCreateConnectionProofModalOpen] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<string | number | null>(null)
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { draggedIdx, dragOverIdx, handleDragStart, handleDragOver, handleDragLeave, setDraggedIdx, setDragOverIdx } =
    useDragReorder()

  const {
    editingScreenIdx,
    editingScreen,
    reorderedScreens,
    showDeleteConfirm,
    deleteConfirmIdx,
    isEditingPredefinedScreen,
    closeEditModal,
    closeDeleteConfirm,
    handleEditClick,
    handleAddScreenClick,
    handleSaveScreen,
    handleDrop,
    handleShowDeleteConfirm,
    handleDeleteConnectionProofPair,
    handleDeleteScreen,
    handleToggleHidden,
    togglingHiddenId,
  } = useScenarioScreens({ showcase, activeScenario, onRefresh })

  useEffect(() => {
    if (showcase.scenarios?.length && !activeScenario) {
      setActiveScenario(showcase.scenarios[0].id)
    }
  }, [showcase.scenarios?.length])

  const lineHeight = useLineHeight(containerRef, [activeScenario, reorderedScreens])

  const handleAddScreenClickWithRefresh = async (...args: Parameters<typeof handleAddScreenClick>) => {
    await handleAddScreenClick(...args)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleSaveScreenWithRefresh = async (updatedScreen: ScenarioScreen) => {
    await handleSaveScreen(updatedScreen)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleDropWithRefresh = async (dragIdx: number, dropIdx: number) => {
    await handleDrop(dragIdx, dropIdx)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleDeleteScreenWithRefresh = async (screenIdx: number) => {
    await handleDeleteScreen(screenIdx)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleDeleteConnectionProofPairWithRefresh = async (deleteIdx: number) => {
    await handleDeleteConnectionProofPair(deleteIdx)
    setIframeRefreshKey((prev) => prev + 1)
  }

  const handleFinish = async () => {
    try {
      await updateShowcase(auth, showcase.name, { status: 'active' })
      navigate(`${adminBaseRoute}/creator`)
    } catch (error) {
      log.error('Error updating showcase status:', error)
    }
  }

  return (
    <div className="flex-1 overflow-auto flex gap-8 py-8 px-8">
      {/* Left Column - Content */}
      <div className="flex-1 flex flex-col items-center justify-start min-w-0">
        {/* Scenarios Tab */}
        <div className="w-4/5 mb-8 px-6 flex items-center justify-between w-full">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-bcgov-black">Scenarios</h2>
            <h5 className="text-gray-500 mt-2">Create scenarios to walk users through credential usage.</h5>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PreviewToggleButton isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {canEdit && (
              <button
                onClick={() => setIsCreateScenarioModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-bcgov-blue text-white hover:bg-blue-700 rounded-lg font-medium transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Scenario
              </button>
            )}
          </div>
        </div>
        {/* Inner Tabs for Scenarios */}
        <div className="w-4/5 px-6 mb-6 w-full">
          <div className="flex gap-4 border-b border-gray-200">
            {showcase.scenarios?.map((scenario) => (
              <div key={scenario.id} className="flex items-center">
                <button
                  onClick={() => setActiveScenario(scenario.id)}
                  className={`py-2 px-3 font-medium transition-colors border-b-2 ${
                    activeScenario === scenario.id
                      ? 'border-bcgov-blue-light text-bcgov-blue-light'
                      : 'border-transparent text-bcgov-darkgrey hover:text-bcgov-black'
                  } ${scenario.hidden ? 'italic text-gray-400' : ''}`}
                >
                  {scenario.name}
                </button>
                {canEdit && (
                  <button
                    onClick={() => handleToggleHidden(scenario.id)}
                    disabled={togglingHiddenId !== null}
                    title={scenario.hidden ? 'Show scenario' : 'Hide scenario'}
                    aria-label={scenario.hidden ? 'Show scenario' : 'Hide scenario'}
                    className="px-1 text-bcgov-darkgrey hover:text-bcgov-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {scenario.hidden ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Scenario Content */}
        <div className="w-4/5 px-6">
          {showcase?.scenarios?.map((scenario) => {
            const currentScreens = reorderedScreens[scenario.id] || scenario.screens || []
            return activeScenario === scenario.id ? (
              <ScenarioTimeline
                key={scenario.id}
                screens={currentScreens}
                scenarioId={scenario.id}
                showcaseName={showcase.name}
                lineHeight={lineHeight}
                containerRef={containerRef}
                draggedIdx={draggedIdx}
                dragOverIdx={dragOverIdx}
                hoverIdx={hoverIdx}
                setHoverIdx={setHoverIdx}
                onEditClick={handleEditClick}
                onAddScreenClick={handleAddScreenClickWithRefresh}
                onShowDeleteConfirm={handleShowDeleteConfirm}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(dropIdx) => {
                  if (draggedIdx !== null) {
                    handleDropWithRefresh(draggedIdx, dropIdx)
                  }
                  setDraggedIdx(null)
                  setDragOverIdx(null)
                }}
                onAddConnectionClick={() => setIsCreateConnectionProofModalOpen(true)}
                onRefreshShowcase={onRefresh}
              />
            ) : null
          })}
        </div>
        <CreateOrEditScreenModal
          isOpen={editingScreenIdx !== null}
          onClose={closeEditModal}
          screen={editingScreen as any}
          progressBarStep={null}
          isCreate={editingScreenIdx === -1}
          screenType="scenarios"
          showcaseName={showcase.name}
          auth={auth}
          disableScreenId={isEditingPredefinedScreen && editingScreenIdx !== -1}
          disableDelete={isEditingPredefinedScreen && editingScreenIdx !== -1}
          onSave={handleSaveScreenWithRefresh}
          onDelete={async () => {
            if (editingScreenIdx !== null && editingScreenIdx !== -1) {
              await handleDeleteScreenWithRefresh(editingScreenIdx)
            }
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
          <div className="w-4/5 mt-8 px-6 flex justify-center w-full">
            <button
              onClick={handleFinish}
              className="px-6 py-2 bg-bcgov-blue text-white font-medium rounded-lg hover:bg-bcgov-blue-dark transition-colors"
            >
              Finish
            </button>
          </div>
        )}
      </div>

      {/* Right Column - Preview */}
      <PreviewPanel
        isExpanded={isExpanded}
        iframeRefreshKey={iframeRefreshKey}
        showcaseName={showcase.name}
        urlPath="scenarios"
        type="scenarios"
      />
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Connection and Proof Screens?"
        description="Are you sure you want to delete these connection and proof request screens? This action cannot be undone."
        onCancel={closeDeleteConfirm}
        onConfirm={() => {
          if (deleteConfirmIdx !== null) {
            handleDeleteConnectionProofPairWithRefresh(deleteConfirmIdx)
          }
        }}
        showIcon={true}
      />
    </div>
  )
}
