import type { ScenarioScreen, Showcase } from '../../../types'

import { PlusIcon } from '@heroicons/react/24/outline'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

import { adminBaseRoute, updateShowcase } from '../../../api/adminApi'
import { useDragReorder } from '../../../hooks/useDragReorder'
import { useLineHeight } from '../../../hooks/useLineHeight'
import { useScenarioScreens } from '../../../hooks/useScenarioScreens'
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
}

export function ScenariosTab({ showcase, isNewShowcase, onRefresh }: ScenariosTabProps) {
  const navigate = useNavigate()
  const auth = useAuth()
  const [activeScenario, setActiveScenario] = useState<string | null>(null)
  const [isCreateScenarioModalOpen, setIsCreateScenarioModalOpen] = useState(false)
  const [isCreateConnectionProofModalOpen, setIsCreateConnectionProofModalOpen] = useState(false)
  const [hoverIdx, setHoverIdx] = useState<string | null>(null)
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
  } = useScenarioScreens({ showcase, activeScenario, onRefresh })

  useEffect(() => {
    if (showcase.scenarios?.length && !activeScenario) {
      setActiveScenario(showcase.scenarios[0].id)
    }
  }, [showcase.scenarios?.length])

  const lineHeight = useLineHeight(containerRef, [activeScenario, reorderedScreens])

  const handleFinish = async () => {
    try {
      await updateShowcase(auth, showcase.name, { status: 'active' })
      navigate(`${adminBaseRoute}/creator`)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating showcase status:', error)
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
      {/* Inner Tabs for Scenarios */}
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
            <ScenarioTimeline
              key={scenario.id}
              screens={currentScreens}
              scenarioId={scenario.id}
              lineHeight={lineHeight}
              containerRef={containerRef}
              draggedIdx={draggedIdx}
              dragOverIdx={dragOverIdx}
              hoverIdx={hoverIdx}
              setHoverIdx={setHoverIdx}
              onEditClick={handleEditClick}
              onAddScreenClick={handleAddScreenClick}
              onShowDeleteConfirm={handleShowDeleteConfirm}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(dropIdx) => {
                if (draggedIdx !== null) {
                  handleDrop(draggedIdx, dropIdx)
                }
                setDraggedIdx(null)
                setDragOverIdx(null)
              }}
              onAddConnectionClick={() => setIsCreateConnectionProofModalOpen(true)}
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
        onSave={(updatedScreen) => handleSaveScreen(updatedScreen as ScenarioScreen)}
        onDelete={async () => {
          if (editingScreenIdx !== null && editingScreenIdx !== -1) {
            await handleDeleteScreen(editingScreenIdx)
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
        onCancel={closeDeleteConfirm}
        onConfirm={() => {
          if (deleteConfirmIdx !== null) {
            handleDeleteConnectionProofPair(deleteConfirmIdx)
          }
        }}
        showIcon={true}
      />
    </div>
  )
}
